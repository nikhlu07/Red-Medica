import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <style>{`
        body {
            font-family: 'Inter', sans-serif;
            background: #F7FAFC;
            color: #ffffff;
        }
        .card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            transition: all 0.3s ease;
            border-radius: 0.75rem;
        }
        .card:hover {
            border-color: #3B82F6;
            transform: translateY(-5px);
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
        }
        .cta-gradient {
            background: linear-gradient(90deg, #3B82F6, #2563EB);
            color: white;
            transition: opacity 0.3s ease;
        }
        .cta-gradient:hover {
            opacity: 0.9;
        }
        ::selection {
            background-color: #3B82F6;
            color: white;
        }
        .table-row-hover:hover {
          background-color: #F7FAFC;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />

        <main className="container mx-auto max-w-7xl px-4 pt-28 pb-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mb-6 inline-flex rounded-full bg-red-100 p-4">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-gray-900 md:text-6xl">
                404 - Page Not Found
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                Sorry, the page you are looking for doesn't exist or has been
                moved.
              </p>
              <div className="mt-8">
                <Link to="/">
                  <Button className="cta-gradient font-semibold" size="lg">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NotFound;
