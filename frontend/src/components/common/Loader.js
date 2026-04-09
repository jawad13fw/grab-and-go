const Loader = ({ label = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex items-center gap-3 text-primary">
      <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;

