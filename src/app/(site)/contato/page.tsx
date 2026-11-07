import type { Metadata } from "next";
import { CONTACT_SUBJECTS } from "@/lib/contact";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a redação da TI MAGAZINE: pautas, correções, imprensa e parcerias.",
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Contato</h1>
      <p className="mt-3 text-muted">
        Sugira uma pauta, peça uma correção ou fale com a redação. Escolha o assunto que melhor
        descreve a sua mensagem.
      </p>
      <div className="mt-8">
        <ContactForm subjects={CONTACT_SUBJECTS} />
      </div>
    </div>
  );
}
