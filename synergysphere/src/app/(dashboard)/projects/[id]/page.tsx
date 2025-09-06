export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Project {params.id}</h1>
      <p className="text-muted-foreground">Project overview coming soon...</p>
    </div>
  );
}