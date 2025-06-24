// import { useState, useEffect, useCallback } from "react";
// import { supabase } from "../lib/supabase";
// import { useAppStore } from "../store/useAppStore";
// import { z } from "zod";

// // Zod schema for website validation
// const WebsiteSchema = z.object({
//   id: z.string().uuid(),
//   user_id: z.string().uuid(),
//   name: z.string().min(3).max(50),
//   description: z.string().max(200).nullable().optional(),
//   domain: z.string().nullable().optional(),
//   status: z.enum(["draft", "published"]),
//   template: z.string(),
//   thumbnail: z.string().nullable().optional(),
//   created_at: z.string(),
//   updated_at: z.string(),
// });

// // TypeScript type derived from Zod schema
// export type Website = z.infer<typeof WebsiteSchema>;

// // Interface for creating websites
// export interface CreateWebsiteData {
//   name: string;
//   description?: string;
//   template: string;
//   thumbnail?: string;
//   initialContent?: Record<string, unknown>;
// }

// // Interface for updating websites
// export interface UpdateWebsiteData {
//   name?: string;
//   description?: string;
//   domain?: string;
//   status?: "draft" | "published";
//   template?: string;
//   thumbnail?: string;
// }

// export const useWebsites = () => {
//   const [websites, setWebsites] = useState<Website[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [pagination, setPagination] = useState({
//     page: 1,
//     pageSize: 10,
//     totalCount: 0,
//   });
//   const { user } = useAppStore();

//   // Helper function for retrying failed requests
//   const fetchWithRetry = useCallback(async <T,>(
//     fn: () => Promise<T>,
//     retries = 3,
//     delay = 1000
//   ): Promise<T> => {
//     try {
//       return await fn();
//     } catch (err) {
//       if (retries > 0) {
//         await new Promise((res) => setTimeout(res, delay));
//         return fetchWithRetry(fn, retries - 1, delay * 2);
//       }
//       throw err;
//     }
//   }, []);

//   // Fetch websites with pagination
//   const fetchWebsites = useCallback(
//     async (page = 1, pageSize = 10) => {
//       if (!user) {
//         setWebsites([]);
//         setLoading(false);
//         return { data: [], count: 0 };
//       }

//       try {
//         setLoading(true);
//         setError(null);

//         // Get total count of websites
//         const { count } = await supabase
//           .from("websites")
//           .select("*", { count: "exact", head: true })
//           .eq("user_id", user.id);

//         // Get paginated websites
//         const { data, error } = await supabase
//           .from("websites")
//           .select("*")
//           .eq("user_id", user.id)
//           .range((page - 1) * pageSize, page * pageSize - 1)
//           .order("created_at", { ascending: false });

//         if (error) throw error;

//         const validated = z.array(WebsiteSchema).parse(data || []);
//         setWebsites(validated);
//         setPagination({
//           page,
//           pageSize,
//           totalCount: count || 0,
//         });

//         return { data: validated, count: count || 0 };
//       } catch (err) {
//         console.error("Error fetching websites:", err);
//         setError(
//           err instanceof Error ? err.message : "Failed to load websites"
//         );
//         return { data: [], count: 0 };
//       } finally {
//         setLoading(false);
//       }
//     },
//     [user]
//   );

//   // Create a new website
//   const createWebsite = async (websiteData: CreateWebsiteData): Promise<Website> => {
//     if (!user) {
//       throw new Error("User not authenticated");
//     }

//     try {
//       const { data, error } = await supabase
//         .from("websites")
//         .insert({
//           user_id: user.id,
//           name: websiteData.name,
//           description: websiteData.description,
//           template: websiteData.template,
//           thumbnail: websiteData.thumbnail,
//           status: "draft",
//         })
//         .select()
//         .single();

//       if (error || !data) throw error || new Error("No data returned");

//       const validated = WebsiteSchema.parse(data);
//       setWebsites((prev) => [validated, ...prev]);
//       setPagination((prev) => ({
//         ...prev,
//         totalCount: prev.totalCount + 1,
//       }));

//       return validated;
//     } catch (err) {
//       console.error("Error creating website:", err);
//       throw err instanceof Error
//         ? err
//         : new Error("Failed to create website");
//     }
//   };

//   // Update an existing website
//   const updateWebsite = async (
//     id: string,
//     updates: UpdateWebsiteData
//   ): Promise<Website> => {
//     try {
//       const { data, error } = await supabase
//         .from("websites")
//         .update(updates)
//         .eq("id", id)
//         .select()
//         .single();

//       if (error || !data) throw error || new Error("No data returned");

//       const validated = WebsiteSchema.parse(data);
//       setWebsites((prev) =>
//         prev.map((w) => (w.id === id ? validated : w))
//       );
//       return validated;
//     } catch (err) {
//       console.error("Error updating website:", err);
//       throw err instanceof Error
//         ? err
//         : new Error("Failed to update website");
//     }
//   };

//   // Delete a website
//   const deleteWebsite = async (id: string): Promise<void> => {
//     try {
//       const { error } = await supabase
//         .from("websites")
//         .delete()
//         .eq("id", id);

//       if (error) throw error;
//       setWebsites((prev) => prev.filter((w) => w.id !== id));
//       setPagination((prev) => ({
//         ...prev,
//         totalCount: Math.max(prev.totalCount - 1, 0),
//       }));
//     } catch (err) {
//       console.error("Error deleting website:", err);
//       throw err instanceof Error
//         ? err
//         : new Error("Failed to delete website");
//     }
//   };

//   // Subscribe to realtime changes
//   useEffect(() => {
//     if (!user) return;

//     const channel = supabase
//       .channel("websites_changes")
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "websites",
//           filter: `user_id=eq.${user.id}`,
//         },
//         () => fetchWebsites(pagination.page, pagination.pageSize)
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [user, fetchWebsites, pagination.page, pagination.pageSize]);

//   // Initial data fetch
//   useEffect(() => {
//     fetchWebsites();
//   }, [fetchWebsites]);

//   return {
//     websites,
//     loading,
//     error,
//     pagination,
//     fetchWebsites,
//     createWebsite,
//     updateWebsite,
//     deleteWebsite,
//   };
// };


import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAppStore } from "../store/useAppStore";
import { z } from "zod";

// Zod schema for website validation
const WebsiteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(3).max(50),
  description: z.string().max(200).nullable().optional(),
  domain: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]),
  template: z.string(),
  thumbnail: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Zod schema for collaborator validation
const CollaboratorSchema = z.object({
  id: z.string().uuid(),
  website_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["owner", "editor", "viewer"]),
  created_at: z.string(),
});

// TypeScript type derived from Zod schema
export type Website = z.infer<typeof WebsiteSchema>;
export type Collaborator = z.infer<typeof CollaboratorSchema>;

// Interface for creating websites
export interface CreateWebsiteData {
  name: string;
  description?: string;
  template: string;
  thumbnail?: string;
  initialContent?: Record<string, unknown>;
}

// Interface for updating websites
export interface UpdateWebsiteData {
  name?: string;
  description?: string;
  domain?: string;
  status?: "draft" | "published";
  template?: string;
  thumbnail?: string;
}

export const useWebsites = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
  });
  const { user } = useAppStore();

  // Helper function for retrying failed requests
  const fetchWithRetry = useCallback(async <T,>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      if (retries > 0) {
        await new Promise((res) => setTimeout(res, delay));
        return fetchWithRetry(fn, retries - 1, delay * 2);
      }
      throw err;
    }
  }, []);

  // Fetch websites with pagination
  const fetchWebsites = useCallback(
    async (page = 1, pageSize = 10) => {
      if (!user) {
        setWebsites([]);
        setLoading(false);
        return { data: [], count: 0 };
      }

      try {
        setLoading(true);
        setError(null);

        // Get total count of websites
        const { count } = await supabase
          .from("websites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Get paginated websites
        const { data, error } = await supabase
          .from("websites")
          .select("*")
          .eq("user_id", user.id)
          .range((page - 1) * pageSize, page * pageSize - 1)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const validated = z.array(WebsiteSchema).parse(data || []);
        setWebsites(validated);
        setPagination({
          page,
          pageSize,
          totalCount: count || 0,
        });

        return { data: validated, count: count || 0 };
      } catch (err) {
        console.error("Error fetching websites:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load websites"
        );
        return { data: [], count: 0 };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Create a new website
  const createWebsite = async (websiteData: CreateWebsiteData): Promise<Website> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const { data, error } = await supabase
        .from("websites")
        .insert({
          user_id: user.id,
          name: websiteData.name,
          description: websiteData.description,
          template: websiteData.template,
          thumbnail: websiteData.thumbnail,
          status: "draft",
        })
        .select()
        .single();

      if (error || !data) throw error || new Error("No data returned");

      const validated = WebsiteSchema.parse(data);
      setWebsites((prev) => [validated, ...prev]);
      setPagination((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
      }));

      return validated;
    } catch (err) {
      console.error("Error creating website:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to create website");
    }
  };

  // Update an existing website
  const updateWebsite = async (
    id: string,
    updates: UpdateWebsiteData
  ): Promise<Website> => {
    try {
      const { data, error } = await supabase
        .from("websites")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error || !data) throw error || new Error("No data returned");

      const validated = WebsiteSchema.parse(data);
      setWebsites((prev) =>
        prev.map((w) => (w.id === id ? validated : w))
      );
      return validated;
    } catch (err) {
      console.error("Error updating website:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to update website");
    }
  };

  // Delete a website
  const deleteWebsite = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("websites")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setWebsites((prev) => prev.filter((w) => w.id !== id));
      setPagination((prev) => ({
        ...prev,
        totalCount: Math.max(prev.totalCount - 1, 0),
      }));
    } catch (err) {
      console.error("Error deleting website:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to delete website");
    }
  };

  // Duplicate a website
  const duplicateWebsite = async (id: string): Promise<Website> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // First, get the original website
      const { data: originalWebsite, error: fetchError } = await supabase
        .from("websites")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !originalWebsite) {
        throw fetchError || new Error("Website not found");
      }

      // Create a duplicate with a new name
      const { data, error } = await supabase
        .from("websites")
        .insert({
          user_id: user.id,
          name: `${originalWebsite.name} (Copy)`,
          description: originalWebsite.description,
          template: originalWebsite.template,
          thumbnail: originalWebsite.thumbnail,
          status: "draft", // Always create duplicates as drafts
        })
        .select()
        .single();

      if (error || !data) throw error || new Error("No data returned");

      const validated = WebsiteSchema.parse(data);
      setWebsites((prev) => [validated, ...prev]);
      setPagination((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
      }));

      return validated;
    } catch (err) {
      console.error("Error duplicating website:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to duplicate website");
    }
  };

  // Publish a website
  const publishWebsite = async (id: string): Promise<Website> => {
    return updateWebsite(id, { status: "published" });
  };

  // Unpublish a website
  const unpublishWebsite = async (id: string): Promise<Website> => {
    return updateWebsite(id, { status: "draft" });
  };

  // Get website collaborators
  const getWebsiteCollaborators = async (websiteId: string): Promise<Collaborator[]> => {
    try {
      const { data, error } = await supabase
        .from("website_collaborators")
        .select("*")
        .eq("website_id", websiteId);

      if (error) {
        // If the table doesn't exist or there's an error, return empty array
        console.warn("Error fetching collaborators:", error);
        return [];
      }

      const validated = z.array(CollaboratorSchema).parse(data || []);
      return validated;
    } catch (err) {
      console.warn("Error getting website collaborators:", err);
      // Return empty array if there's any error (e.g., table doesn't exist)
      return [];
    }
  };

  // Add collaborator to website
  const addCollaborator = async (
    websiteId: string,
    userId: string,
    role: "editor" | "viewer" = "viewer"
  ): Promise<Collaborator> => {
    try {
      const { data, error } = await supabase
        .from("website_collaborators")
        .insert({
          website_id: websiteId,
          user_id: userId,
          role: role,
        })
        .select()
        .single();

      if (error || !data) throw error || new Error("No data returned");

      return CollaboratorSchema.parse(data);
    } catch (err) {
      console.error("Error adding collaborator:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to add collaborator");
    }
  };

  // Remove collaborator from website
  const removeCollaborator = async (collaboratorId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("website_collaborators")
        .delete()
        .eq("id", collaboratorId);

      if (error) throw error;
    } catch (err) {
      console.error("Error removing collaborator:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to remove collaborator");
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("websites_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "websites",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchWebsites(pagination.page, pagination.pageSize)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWebsites, pagination.page, pagination.pageSize]);

  // Initial data fetch
  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  return {
    websites,
    loading,
    error,
    pagination,
    fetchWebsites,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    duplicateWebsite,
    publishWebsite,
    unpublishWebsite,
    getWebsiteCollaborators,
    addCollaborator,
    removeCollaborator,
  };
};