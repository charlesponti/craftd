import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useUser } from "~/hooks/useAuth";
import type { JobApplication, JobApplicationInsert } from "~/types/career";

// Define query keys at the top for consistent cache management
const APPLICATIONS_KEY = ["applications", "getAll"];

// Type for partial updates with ID
type PartialWithId<T> = Partial<T> & { id: string };

/**
 * Hook for creating a new job application
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const createApplication = useMutation({
    mutationFn: async (applicationData: JobApplicationInsert) => {
      try {
        const formData = new FormData();
        formData.append("operation", "create");
        formData.append("applicationData", JSON.stringify(applicationData));

        const response = await fetch("/api/job-applications", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to create application");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to create application");
        }

        return result.data;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create application")
        );
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      setError(null);
    },
  });

  return {
    error,
    isLoading: createApplication.isPending,
    isError: createApplication.isError,
    createApplication,
  };
}

/**
 * Hook for updating an existing job application
 */
export function useUpdateApplication() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const updateApplication = useMutation({
    mutationFn: async (applicationData: PartialWithId<JobApplication>) => {
      try {
        const formData = new FormData();
        formData.append("operation", "update");
        formData.append("applicationData", JSON.stringify(applicationData));

        const response = await fetch("/api/job-applications", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to update application");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to update application");
        }

        return result.data;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to update application")
        );
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      setError(null);
    },
  });

  return {
    error,
    isLoading: updateApplication.isPending,
    isError: updateApplication.isError,
    updateApplication,
  };
}

/**
 * Hook for deleting a job application
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      try {
        const formData = new FormData();
        formData.append("operation", "delete");
        formData.append("applicationId", id);

        const response = await fetch("/api/job-applications", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to delete application");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to delete application");
        }

        return result.data;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to delete application")
        );
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      setError(null);
    },
  });

  return {
    error,
    isLoading: deleteApplication.isPending,
    isError: deleteApplication.isError,
    deleteApplication: deleteApplication.mutateAsync,
  };
}

/**
 * Hook for fetching job applications with optional filtering
 */
export function useApplications(options = {}) {
  const user = useUser();

  // Default options with sensible values
  const defaultOptions = {
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  };

  const query = useQuery<JobApplication[]>({
    queryKey: APPLICATIONS_KEY,
    queryFn: async () => {
      const response = await fetch("/api/job-applications");

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch applications");
      }

      return result.data;
    },
    ...defaultOptions,
    ...options,
  });

  return {
    applications: query.data || [],
    ...query,
  };
}

/**
 * Hook for fetching a single job application by ID
 */
export function useApplication(id: string, options = {}) {
  const user = useUser();

  // Default options with sensible values
  const defaultOptions = {
    enabled: !!user && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  };

  const queryKey = [...APPLICATIONS_KEY, id];

  const query = useQuery<JobApplication>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/job-applications/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch application");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch application");
      }

      return result.data;
    },
    ...defaultOptions,
    ...options,
  });

  return {
    application: query.data,
    ...query,
  };
}
