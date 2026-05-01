export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`mb-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`mt-4 flex items-center ${className}`}>
      {children}
    </div>
  );
}