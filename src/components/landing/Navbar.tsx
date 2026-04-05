import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="Sentra AI DLP" className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">Sentra AI DLP</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          <a href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
          <a href="https://sentrashield.com" className="text-sm text-muted-foreground/60 transition-colors hover:text-muted-foreground border-l border-border/50 pl-8">Enterprise →</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button variant="hero" size="sm">Start Free Trial</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
