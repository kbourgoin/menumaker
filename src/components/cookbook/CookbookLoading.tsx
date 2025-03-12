
const CookbookLoading = () => {
  return (
    <div className="text-center p-6 border rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500 mx-auto"></div>
      <p className="text-muted-foreground mt-2">Loading cookbooks...</p>
    </div>
  );
};

export default CookbookLoading;
