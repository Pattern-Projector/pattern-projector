export function ModalList({ children }: { children?: any }) {
  return (
    <ul className="list-disc list-inside text-sm text-gray-500 mt-2 px-4 pb-4">
      {children}
    </ul>
  );
}
