type StageConnectorProps = {
  variant: "default" | "success" | "cancelled";
};

export default function StageConnector({ variant }: StageConnectorProps) {
  const className =
    variant === "success"
      ? "bg-success"
      : variant === "cancelled"
        ? "bg-destructive/30"
        : "bg-border";

  return <div className={`flex-1 h-0.5 mx-1 ${className}`} />;
}
