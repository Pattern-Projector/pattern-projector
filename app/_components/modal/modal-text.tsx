export function ModalText({ children }: { children?: any }) {
  return (
    <div className="mt-2 px-4 pb-4">
      <p className="text-sm text-gray-500">{children}</p>
    </div>
  );
}
