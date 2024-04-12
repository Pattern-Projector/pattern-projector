export default function Modal({
  open,
  children,
}: {
  open: boolean;
  children?: any;
}) {
  const windowClass = open
    ? "opacity-100 translate-y-0 sm:scale-100"
    : "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95";
  const pageClass = open ? "opacity-100" : "opacity-0";
  return (
    <div
      className={`relative z-50 ${open ? "" : "hidden"}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${pageClass}`}
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg ${windowClass}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
