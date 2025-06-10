import { faker } from "@faker-js/faker/locale/fr";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { Database } from "~/types/database.types";

// Charge les variables d'environnement
config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
  console.error(
    "❌ Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE sont requises"
  );
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const generateProject = (
  userId: string,
  clientId: string
): Database["public"]["Tables"]["projects"]["Insert"] => {
  const password = faker.internet.password({ length: 6 });
  const status = faker.helpers.arrayElement([
    "draft",
    "in_progress",
    "completed",
  ] as const);

  return {
    user_id: userId,
    client_id: clientId,
    title: faker.company.catchPhrase(),
    description: faker.helpers.maybe(() => faker.lorem.paragraph(), {
      probability: 0.7,
    }),
    status,
    initial_price: faker.helpers.maybe(
      () => faker.number.int({ min: 500, max: 10000 }),
      { probability: 0.8 }
    ),
    password_hash: password,
    password_expires_at: faker.helpers.maybe(
      () => faker.date.future({ years: 1 }).toISOString(),
      { probability: 0.3 }
    ),
  };
};

async function getRandomClients(userId: string, count: number) {
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .limit(count * 2); // Récupère plus de clients pour avoir du choix

  if (error || !clients || clients.length === 0) {
    console.error("❌ Aucun client trouvé pour cet utilisateur");
    process.exit(1);
  }

  return clients;
}

async function seedProjects(userId: string, count: number = 20) {
  // Récupère les clients existants
  const clients = await getRandomClients(userId, count);

  const projects = Array.from({ length: count }, () => {
    const randomClient = faker.helpers.arrayElement(clients);
    return generateProject(userId, randomClient.id);
  });

  const { data, error } = await supabase
    .from("projects")
    .insert(projects)
    .select();

  if (error) {
    console.error("Error seeding projects:", error);
    return;
  }

  console.log(`✅ Successfully created ${data.length} projects`);

  // Affiche quelques exemples de mots de passe générés
  console.log("\n📋 Exemples de mots de passe générés:");
  projects.slice(0, 3).forEach((project, index) => {
    console.log(`Project ${index + 1}: ${project.password_hash}`);
  });
}

// Pour utiliser le script:
// 1. Assurez-vous d'avoir les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE
// 2. Remplacez USER_ID par votre ID utilisateur
// 3. Assurez-vous d'avoir des clients existants pour cet utilisateur
// 4. Changez le nombre de projets à générer si besoin
seedProjects("f552326e-e6e2-4072-86a3-feec9e9f2af5", 30);
