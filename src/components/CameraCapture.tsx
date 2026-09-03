"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { concluirComFoto } from "@/app/app/minhas/actions";

export default function CameraCapture({ tarefaId }: { tarefaId: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [aberto, setAberto] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function pararCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }

  async function abrirCamera() {
    setErro(null);
    setFoto(null);
    setAberto(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setErro("Não foi possível acessar a câmera. Verifique se você deu permissão pro navegador usá-la.");
    }
  }

  function capturar() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setFoto(canvas.toDataURL("image/jpeg", 0.85));
    pararCamera();
  }

  function fechar() {
    pararCamera();
    setAberto(false);
    setFoto(null);
    setErro(null);
  }

  async function enviar() {
    if (!foto) return;
    setEnviando(true);
    setErro(null);
    try {
      const blob = await (await fetch(foto)).blob();
      const file = new File([blob], "foto.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.set("foto", file);
      await concluirComFoto(tarefaId, fd);
      setAberto(false);
      setFoto(null);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar a foto. Tenta de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button type="button" className="photo-input-btn" onClick={abrirCamera}>
        📷 Tirar foto e concluir
      </button>
      {aberto && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && fechar()}>
          <div className="modal" style={{ maxWidth: 420, padding: 16 }}>
            <button type="button" className="modal-close" onClick={fechar}>
              ×
            </button>
            <h3>Tirar foto</h3>
            {erro && <p className="error-text">{erro}</p>}

            {!foto && (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: "100%", borderRadius: 10, background: "#000", display: streaming ? "block" : "none" }}
              />
            )}
            {!foto && streaming && (
              <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={capturar}>
                Capturar
              </button>
            )}

            {foto && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt="Prévia da foto" style={{ width: "100%", borderRadius: 10 }} />
                <div className="row" style={{ marginTop: 10 }}>
                  <button type="button" className="btn btn-outline" onClick={abrirCamera} disabled={enviando}>
                    Tirar de novo
                  </button>
                  <button type="button" className="btn btn-primary" onClick={enviar} disabled={enviando}>
                    {enviando ? "Enviando…" : "Enviar e concluir"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
