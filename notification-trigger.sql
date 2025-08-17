-- Trigger pour les changements de statut
CREATE OR REPLACE FUNCTION handle_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_user_id UUID;
  project_title TEXT;
  client_first_name TEXT;
  client_last_name TEXT;
  client_company_name TEXT;
  client_type TEXT;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Récupérer les infos du projet et du client
  SELECT p.user_id, p.title, c.first_name, c.last_name, c.company_name, c.type
  INTO project_user_id, project_title, client_first_name, client_last_name, client_company_name, client_type
  FROM projects p
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE p.id = NEW.project_id;
  
  -- Déterminer le type de notification selon la table et le nouveau statut
  IF TG_TABLE_NAME = 'moodboards' AND NEW.status = 'revision_requested' THEN
    notification_type := 'moodboard_revision_requested';
    notification_title := 'Révision demandée';
    notification_message := format('Votre client %s souhaite ajuster son moodboard. Prêt à peaufiner ?', 
      CASE 
        WHEN client_type = 'company' THEN client_company_name
        WHEN client_type = 'individual' THEN client_first_name
        ELSE COALESCE(client_company_name, client_first_name, 'souhaite ajuster son moodboard')
      END);
  ELSIF TG_TABLE_NAME = 'galleries' AND NEW.status = 'revision_requested' THEN
    notification_type := 'gallery_revision_requested';
    notification_title := 'Révision demandée';
    notification_message := format('Votre client %s aimerait retoucher sa galerie. À vos pinceaux !', 
      CASE 
        WHEN client_type = 'company' THEN client_company_name
        WHEN client_type = 'individual' THEN client_first_name
        ELSE COALESCE(client_company_name, client_first_name, 'aimerait retoucher sa galerie')
      END);
  ELSIF TG_TABLE_NAME = 'selections' AND NEW.status = 'revision_requested' THEN
    notification_type := 'selection_revision_requested';
    notification_title := 'Révision demandée';
    notification_message := format('Votre client %s veut ajuster sa sélection. Un petit coup de polish ?', 
      CASE 
        WHEN client_type = 'company' THEN client_company_name
        WHEN client_type = 'individual' THEN client_first_name
        ELSE COALESCE(client_company_name, client_first_name, 'veut ajuster sa sélection')
      END);
  ELSIF TG_TABLE_NAME = 'proposals' AND NEW.status = 'revision_requested' THEN
    notification_type := 'proposal_revision_requested';
    notification_title := 'Révision demandée';
    notification_message := format('Votre client %s souhaite modifier son devis. On ajuste ensemble ?', 
      CASE 
        WHEN client_type = 'company' THEN client_company_name
        WHEN client_type = 'individual' THEN client_first_name
        ELSE COALESCE(client_company_name, client_first_name, 'souhaite modifier son devis')
      END);
  ELSIF TG_TABLE_NAME = 'proposals' AND NEW.status = 'payment_pending' THEN
    notification_type := 'proposal_payment_pending';
    notification_title := 'Paiement en attente';
    notification_message := format('Votre devis attend son règlement. Ça va bouger !');
  ELSIF TG_TABLE_NAME = 'galleries' AND NEW.status = 'payment_pending' THEN
    notification_type := 'gallery_payment_pending';
    notification_title := 'Paiement en attente';
    notification_message := format('Votre galerie attend son paiement. Bientôt dans votre poche !');
  END IF;
  
  -- Créer la notification si un type a été déterminé
  IF notification_type IS NOT NULL THEN
    PERFORM create_notification(
      project_user_id,
      notification_type,
      notification_title,
      notification_message,
      jsonb_build_object(
        'project_id', NEW.project_id,
        'project_title', project_title,
        'item_id', NEW.id,
        'item_type', TG_TABLE_NAME,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables concernées
CREATE TRIGGER trigger_moodboard_status_notification
  AFTER UPDATE ON moodboards
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_status_change_notification();

CREATE TRIGGER trigger_gallery_status_notification
  AFTER UPDATE ON galleries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_status_change_notification();

CREATE TRIGGER trigger_selection_status_notification
  AFTER UPDATE ON selections
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_status_change_notification();

CREATE TRIGGER trigger_proposal_status_notification
  AFTER UPDATE ON proposals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_status_change_notification();

-- Trigger spécial pour proposal completed avec deposit Stripe
CREATE OR REPLACE FUNCTION handle_proposal_completed_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_user_id UUID;
  project_title TEXT;
  project_payment_method TEXT;
  proposal_deposit_required BOOLEAN;
  client_first_name TEXT;
  client_last_name TEXT;
  client_company_name TEXT;
BEGIN
  -- Récupérer les infos du projet et du client
  SELECT p.user_id, p.title, p.payment_method, pr.deposit_required, c.first_name, c.last_name, c.company_name
  INTO project_user_id, project_title, project_payment_method, proposal_deposit_required, client_first_name, client_last_name, client_company_name
  FROM projects p
  JOIN proposals pr ON pr.project_id = p.id
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE p.id = NEW.project_id AND pr.id = NEW.id;
  
  -- Notification si proposal completed + payment_method stripe + deposit required
  IF NEW.status = 'completed' 
     AND project_payment_method = 'stripe' 
     AND proposal_deposit_required = true THEN
    
    PERFORM create_notification(
      project_user_id,
      'proposal_completed_with_deposit',
      'Devis finalisé + Acompte reçu',
      format('Félicitations ! Votre devis est bouclé et l''acompte a été reçu. C''est parti !'),
      jsonb_build_object(
        'project_id', NEW.project_id,
        'project_title', project_title,
        'proposal_id', NEW.id,
        'deposit_amount', NEW.deposit_amount
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proposal_completed_notification
  AFTER UPDATE ON proposals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION handle_proposal_completed_notification();

-- Trigger spécial pour gallery completed avec payment_method stripe
CREATE OR REPLACE FUNCTION handle_gallery_completed_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_user_id UUID;
  project_title TEXT;
  project_payment_method TEXT;
  client_first_name TEXT;
  client_last_name TEXT;
  client_company_name TEXT;
BEGIN
  -- Récupérer les infos du projet et du client
  SELECT p.user_id, p.title, p.payment_method, c.first_name, c.last_name, c.company_name
  INTO project_user_id, project_title, project_payment_method, client_first_name, client_last_name, client_company_name
  FROM projects p
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE p.id = NEW.project_id;
  
  -- Notification si gallery completed + payment_method stripe
  IF NEW.status = 'completed' AND project_payment_method = 'stripe' THEN
    
    PERFORM create_notification(
      project_user_id,
      'gallery_completed_stripe',
      'Galerie finalisée + Paiement reçu',
      format('Parfait ! Votre galerie est terminée et le paiement a été reçu.'),
      jsonb_build_object(
        'project_id', NEW.project_id,
        'project_title', project_title,
        'gallery_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gallery_completed_notification
  AFTER UPDATE ON galleries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION handle_gallery_completed_notification();