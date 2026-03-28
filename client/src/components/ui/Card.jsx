export const Card = ({ children, className = '', hover = false }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 ${hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all' : 'shadow-sm'} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-slate-100 ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl ${className}`}>{children}</div>
);

export default Card;