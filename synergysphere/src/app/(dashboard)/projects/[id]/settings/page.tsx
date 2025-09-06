export default function ProjectSettingsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Settings - Project {params.id}</h1>
      <p className="text-muted-foreground">Project settings coming soon...</p>
    </div>
  );
}