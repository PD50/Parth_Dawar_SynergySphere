export default function ProjectDiscussionsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Discussions - Project {params.id}</h1>
      <p className="text-muted-foreground">Threaded discussions coming soon...</p>
    </div>
  );
}