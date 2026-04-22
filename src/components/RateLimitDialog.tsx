import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface RateLimitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resetAt: number | null;
    limit: number;
}

export function RateLimitDialog({ open, onOpenChange, resetAt, limit }: RateLimitDialogProps) {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        if (!open || !resetAt) return;
        const tick = () => {
            const diff = Math.max(0, resetAt - Date.now());
            if (diff === 0) {
                setCountdown('Agora');
                return;
            }
            const totalSecs = Math.ceil(diff / 1000);
            const m = Math.floor(totalSecs / 60);
            const s = totalSecs % 60;
            setCountdown(`${m}min ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [open, resetAt]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl mx-auto overflow-hidden text-center p-6 space-y-6 bg-app-surface/95 border-red-500/20 shadow-2xl backdrop-blur-md">
                <DialogHeader className="pt-2 text-center items-center space-y-3">
                    <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center -mb-2">
                        <Clock className="h-7 w-7 text-red-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-app-text">
                        Limite Atingido
                    </DialogTitle>
                    <DialogDescription className="text-[0.95rem] text-app-text-muted leading-relaxed max-w-sm mx-auto">
                        Você utilizou todos os <strong className="text-app-text">{limit} comentários</strong> disponíveis para esta hora.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-1">
                    <p className="text-xs uppercase tracking-wider text-red-400 font-semibold mb-1">
                        Tempo para renovação
                    </p>
                    <p className="text-2xl font-mono text-red-500 font-bold tracking-tight">
                        {countdown}
                    </p>
                </div>

                <p className="text-[0.8rem] text-app-text-muted/80 leading-relaxed px-2">
                    Para garantir a qualidade e estabilidade da extração dos comentários teológicos para todos os usuários, aplicamos este limite por hora.
                </p>

                <div className="pt-2 flex flex-col gap-3">
                    <Button
                        variant="outline"
                        className="w-full bg-app-raised border-border text-app-text hover:bg-app-raised/80"
                        onClick={() => onOpenChange(false)}
                    >
                        Entendi, vou aguardar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
