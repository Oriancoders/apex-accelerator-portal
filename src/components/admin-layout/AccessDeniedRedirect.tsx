import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type AccessDeniedRedirectProps = {
  to: string;
  message: string;
};

export default function AccessDeniedRedirect({ to, message }: AccessDeniedRedirectProps) {
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Access Denied",
      description: message,
      variant: "destructive",
    });
  }, [message, toast]);

  return <Navigate to={to} replace />;
}
