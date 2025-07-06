
import { Layout } from "@/components/layout";

const LoadingState = () => {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-pulse p-8">
        <div className="h-6 bg-gray-200 rounded mb-4 w-24"></div>
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="h-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </Layout>
  );
};

export default LoadingState;
