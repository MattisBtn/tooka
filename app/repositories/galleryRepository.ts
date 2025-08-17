import type { Tables } from "~/types/database.types";
import type {
  Gallery,
  GalleryImage,
  IGalleryFilters,
  IGalleryRepository,
  IPagination,
} from "~/types/gallery";

export const galleryRepository: IGalleryRepository = {
  async findMany(
    filters: IGalleryFilters,
    pagination: IPagination
  ): Promise<Gallery[]> {
    const supabase = useSupabaseClient();

    let query = supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      );

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch galleries: ${error.message}`);
    }

    return data || [];
  },

  async findById(id: string): Promise<Gallery | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch gallery: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(projectId: string): Promise<Gallery | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        ),
        gallery_images(
          id,
          file_url,
          created_at,
          gallery_id
        )
      `
      )
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch gallery: ${error.message}`);
    }

    return data;
  },

  /**
   * Get gallery by project ID with all related data in a single query
   */
  async findByProjectIdWithDetails(projectId: string): Promise<{
    gallery: Gallery | null;
    project: Tables<"projects"> | null;
    proposal: Tables<"proposals"> | null;
    images: GalleryImage[];
  } | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects(
          *,
          proposals(*)
        ),
        gallery_images(*)
      `
      )
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch gallery with details: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Extract proposal from the nested project data
    const proposal = data.project?.proposals?.[0] || null;

    return {
      gallery: data,
      project: data.project,
      proposal: proposal,
      images: data.gallery_images || [],
    };
  },

  async create(
    galleryData: Omit<Gallery, "id" | "created_at" | "updated_at">
  ): Promise<Gallery> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("galleries")
      .insert(galleryData)
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create gallery: ${error.message}`);
    }

    return data;
  },

  async update(id: string, galleryData: Partial<Gallery>): Promise<Gallery> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("galleries")
      .update(galleryData)
      .eq("id", id)
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update gallery: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase.from("galleries").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete gallery: ${error.message}`);
    }
  },
};
