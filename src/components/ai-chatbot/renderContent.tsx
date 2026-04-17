export function renderContent(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const code = part.slice(3, -3).replace(/^\w+\n/, "");
      return (
        <pre key={i} className="bg-background/80 rounded-lg p-3 my-2 text-xs overflow-x-auto border border-border">
          <code>{code}</code>
        </pre>
      );
    }

    const bolded = part.split(/(\*\*.*?\*\*)/g).map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={j}>{seg.slice(2, -2)}</strong>;
      }
      return seg;
    });

    return <span key={i}>{bolded}</span>;
  });
}
