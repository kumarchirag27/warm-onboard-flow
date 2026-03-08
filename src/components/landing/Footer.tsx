const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center">
            <img src="/logo.png" alt="SentraShield" className="h-7 w-auto" />
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <a href="#" className="hover:text-foreground transition-colors">Status</a>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2026 SentraShield. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
