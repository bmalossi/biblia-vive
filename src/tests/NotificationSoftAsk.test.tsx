import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import NotificationSoftAsk, { resetNotificationSoftAskSession } from "@/components/NotificationSoftAsk";
import { isMessagingSupported, getPushNotificationToken } from "@/lib/firebase";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      variants: _variants,
      transition: _transition,
      ...props
    }: React.ComponentProps<"div"> & Record<string, unknown>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock("@/lib/firebase", () => ({
  isMessagingSupported: vi.fn(),
  getPushNotificationToken: vi.fn().mockResolvedValue("test-fcm-token"),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user-id" } }),
}));

const requestPermissionMock = vi.fn();

function mockNotificationPermission(permission: NotificationPermission) {
  Object.defineProperty(window, "Notification", {
    writable: true,
    configurable: true,
    value: {
      permission,
      requestPermission: requestPermissionMock,
    },
  });
}

function mockScrollHeight(height: number) {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: height,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 800,
  });
}

async function flushMessagingSupport() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function showSoftAskViaTimer() {
  await flushMessagingSupport();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(25000);
  });
  expect(screen.getByRole("dialog")).toBeInTheDocument();
}

describe("NotificationSoftAsk", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetNotificationSoftAskSession();
    requestPermissionMock.mockReset();
    vi.mocked(isMessagingSupported).mockResolvedValue(true);
    mockNotificationPermission("default");
    mockScrollHeight(2000);

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(null),
        ready: Promise.resolve({}),
      },
    });

    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renderiza título e botões após o timer de 25s", async () => {
    render(<NotificationSoftAsk />);
    await showSoftAskViaTimer();

    expect(screen.getByText("Para sua caminhada...")).toBeInTheDocument();
    expect(
      screen.getByText("Posso te lembrar quando um novo capítulo estiver esperando por você?")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sim, pode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Depois" })).toBeInTheDocument();
  });

  it("não exibe quando permissão já é granted", async () => {
    mockNotificationPermission("granted");
    render(<NotificationSoftAsk />);

    await act(async () => {
      vi.advanceTimersByTime(25000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não exibe quando permissão já é denied", async () => {
    mockNotificationPermission("denied");
    render(<NotificationSoftAsk />);

    await act(async () => {
      vi.advanceTimersByTime(25000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fecha ao clicar em Depois e não reaparece na mesma sessão", async () => {
    render(<NotificationSoftAsk />);
    await showSoftAskViaTimer();

    fireEvent.click(screen.getByRole("button", { name: "Depois" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    render(<NotificationSoftAsk />);
    await flushMessagingSupport();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(25000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fecha ao clicar no X e não reaparece na mesma sessão", async () => {
    render(<NotificationSoftAsk />);
    await showSoftAskViaTimer();

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    render(<NotificationSoftAsk />);
    await flushMessagingSupport();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(25000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("solicita permissão ao clicar em Sim, pode", async () => {
    requestPermissionMock.mockResolvedValue("granted");
    render(<NotificationSoftAsk />);
    await showSoftAskViaTimer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sim, pode" }));
    });

    expect(requestPermissionMock).toHaveBeenCalledOnce();
    expect(getPushNotificationToken).toHaveBeenCalledOnce();
  });

  it("dispara exibição ao rolar ~80% da página", async () => {
    mockScrollHeight(1000);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });

    render(<NotificationSoftAsk />);
    await flushMessagingSupport();

    Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });

    await act(async () => {
      fireEvent.scroll(window);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
