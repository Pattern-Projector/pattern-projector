export function ModalActions({ children }: { children: any }) {
  return (
    <div className="bg-gray-50 gap-2 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
      {children}
    </div>
  );
}
