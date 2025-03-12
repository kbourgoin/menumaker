
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  List, 
  BookOpen, 
  Utensils 
} from "lucide-react";
import AddCookedDishDialog from "./AddCookedDishDialog";

const Header = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`sticky top-0 z-10 transition-all duration-300 ${
      scrolled ? "py-2 glass shadow-md" : "py-4"
    }`}>
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="w-8 h-8 text-terracotta-500" />
            <h1 className="text-xl md:text-2xl font-serif tracking-tight">Family Meals</h1>
          </Link>
          
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link to="/">
              <Button 
                variant={isActive("/") ? "secondary" : "ghost"} 
                size="sm" 
                className={`transition-all duration-300 ${
                  isActive("/") 
                    ? "bg-terracotta-100 text-terracotta-500" 
                    : "hover:bg-terracotta-50 hover:text-terracotta-500"
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            
            <Link to="/weekly-menu">
              <Button 
                variant={isActive("/weekly-menu") ? "secondary" : "ghost"} 
                size="sm"
                className={`transition-all duration-300 ${
                  isActive("/weekly-menu") 
                    ? "bg-terracotta-100 text-terracotta-500" 
                    : "hover:bg-terracotta-50 hover:text-terracotta-500"
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Weekly Menu</span>
              </Button>
            </Link>
            
            <Link to="/all-meals">
              <Button 
                variant={isActive("/all-meals") ? "secondary" : "ghost"} 
                size="sm"
                className={`transition-all duration-300 ${
                  isActive("/all-meals") 
                    ? "bg-terracotta-100 text-terracotta-500" 
                    : "hover:bg-terracotta-50 hover:text-terracotta-500"
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">All Dishes</span>
              </Button>
            </Link>
            
            {/* Renamed to Cook Dish and removed New Dish button */}
            <AddCookedDishDialog />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
