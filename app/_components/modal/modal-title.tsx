export function ModalTitle({ children }: { children?: any }) {
  return (
    <h3
      className="text-base font-semibold leading-6 text-gray-900"
      id="modal-title"
    >
      {children}
    </h3>
  );
}
