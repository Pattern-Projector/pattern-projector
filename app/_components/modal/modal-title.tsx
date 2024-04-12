export function ModalTitle({ children }: { children?: any }) {
  return (
    <h3
      className="px-4 pt-4 text-base font-semibold leading-6 text-gray-900"
      id="modal-title"
    >
      {children}
    </h3>
  );
}
