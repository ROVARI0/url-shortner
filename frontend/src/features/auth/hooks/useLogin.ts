import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth.api";
import type { ApiError } from "../../../types/api.types";

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      navigate("/");
    },
    onError: (error: ApiError) => {
      console.error(error.message);
    },
  });
}
