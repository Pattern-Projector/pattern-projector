import Modal from "@/_components/modal/modal";
import { ModalTitle } from "@/_components/modal/modal-title";
import { ModalText } from "@/_components/modal/modal-text";
import ModalContent from "@/_components/modal/modal-content";
import { ModalActions } from "@/_components/modal/modal-actions";
import { Button } from "@/_components/buttons/button";
import { ButtonColor } from "@/_components/theme/colors";
import { ButtonStyle } from "@/_components/theme/styles";

export default function PdfErrorModal({
  open,
  onClose,
  email,
  error,
}: {
  open: boolean;
  onClose: Function;
  email: string;
  error: { type: string; error: Error } | null;
}) {
  const errorMessage = error ? `${error.type}:\n${error.error.message}` : "";
  function buildHref() {
    const subject = "PDF Open Error";
    const body = `There was an error opening a PDF: ${errorMessage}`;
    return `mailto:${email}?subject=${encodeURI(subject)}&body=${encodeURI(body)}`;
  }
  return (
    <Modal open={open}>
      <div className="sm:flex sm:items-start">
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <ModalContent>
            <ModalTitle>Error Opening PDF</ModalTitle>
            <ModalText>
              Your PDF was unable to be opened. Please send the following error
              to <span className="font-bold">{email}</span>:
            </ModalText>
            <textarea
              className="border-2 w-full mt-2 rounded-md"
              rows={8}
              defaultValue={errorMessage || ""}
            />
          </ModalContent>
          <ModalActions>
            <Button className="sm:ml-1" onClick={() => onClose()}>
              Close
            </Button>
            <Button
              color={ButtonColor.PURPLE}
              style={ButtonStyle.FILLED}
              href={buildHref()}
            >
              Send Email
            </Button>
          </ModalActions>
        </div>
      </div>
    </Modal>
  );
}
