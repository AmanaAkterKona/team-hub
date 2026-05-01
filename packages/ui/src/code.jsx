export function Code({ children, className = "", ...props }) {
  return (
    <code
      className={`relative rounded bg-gray-100 dark:bg-gray-800 px-[0.3rem] py-[0.2rem] font-mono text-sm text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </code>
  );
}

export function CodeBlock({ children, className = "", language = "" }) {
  return (
    <pre
      className={`rounded-lg bg-gray-100 dark:bg-gray-800 p-4 overflow-x-auto text-sm font-mono text-gray-900 dark:text-gray-100 ${className}`}
    >
      <code className={language ? `language-${language}` : ""}>
        {children}
      </code>
    </pre>
  );
}