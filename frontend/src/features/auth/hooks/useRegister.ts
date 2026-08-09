import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth.api";
import type { ApiError } from "../../../types/api.types";

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate("/login");
    },
    onError: (error: ApiError) => {
      console.error(error.message);
    },
  });
}
