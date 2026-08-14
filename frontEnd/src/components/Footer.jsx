import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="hidden md:block w-full pt-stack-lg pb-stack-md border-t border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-lowest">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-gutter max-w-container-max mx-auto">
        <div className="mb-stack-md md:mb-0">
          <span className="text-headline-sm font-headline-sm text-primary block mb-stack-sm">Hanout</span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Precision Tech Repair.
          </p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-transform duration-200 ease-in-out" to="/contact">Contact</Link>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-transform duration-200 ease-in-out" to="/hours">Shop Hours</Link>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-transform duration-200 ease-in-out" to="/legal">Legal</Link>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-transform duration-200 ease-in-out" to="/newsletter">Newsletter</Link>
        </div>
        
        <div className="md:col-span-2 flex items-end justify-start md:justify-end mt-stack-md md:mt-0">
          <p className="font-label-sm text-label-sm text-outline">
            © 2026 Hanout Tech Repair. Precision Engineering.
          </p>
        </div>
      </div>
    </footer>
  );
}
