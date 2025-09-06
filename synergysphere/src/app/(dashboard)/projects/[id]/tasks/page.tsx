export default function ProjectTasksPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Tasks - Project {params.id}</h1>
      <p className="text-muted-foreground">Kanban board coming soon...</p>
    </div>
  );
}