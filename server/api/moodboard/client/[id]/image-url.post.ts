import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const { id: _id } = getRouterParams(event);
  const { filePath } = await readBody(event);

  if (!filePath) {
    throw createError({
      statusCode: 400,
      message: "filePath is required",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

    // Get signed URL for moodboard images
    const { data, error } = await supabase.storage
      .from("moodboard-images")
      .createSignedUrl(filePath, 3600, {
        transform: {
          width: 1080,
          height: 1080,
        },
      }); // 1 hour expiry

    if (error) {
      console.error("Error creating signed URL:", error);
      throw createError({
        statusCode: 500,
        message: "Failed to generate image URL",
      });
    }

    return {
      url: data.signedUrl,
    };
  } catch (error) {
    console.error("Error in image-url endpoint:", error);
    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});
