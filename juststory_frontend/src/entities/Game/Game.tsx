"use client";
import {
  getActions,
  sendMessage,
  sendMessageFirst,
} from "@/lib/entities/ai/aiSlice";
import { validateToken } from "@/src/utils/validateToken";
import { RootState } from "@/lib/store";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import TypeIt from "typeit-react";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import styles from "./Game.module.css";

const Game = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { actions, loading, error, imagePath } = useSelector(
    (state: RootState) => state.ai
  );
  const params = useParams();
  const currentGameScene = params.game;
  const formattedGameScene = useMemo(() => {
    const decodedCurrentGameScene =
      typeof currentGameScene === "string"
        ? decodeURIComponent(currentGameScene).replace(/-/g, " ")
        : "Игра не найдена";
    return (
      decodedCurrentGameScene.charAt(0).toUpperCase() +
      decodedCurrentGameScene.slice(1)
    );
  }, [currentGameScene]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [chooseAction, setChooseAction] = useState<string>("Сделать");
  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [loadingSendMessage, setLoadingSendMessage] = useState<boolean>(false);
  const [displayedHistory, setDisplayedHistory] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const historyRef = useRef<string>("");
  const isMountedRef = useRef<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const token = Cookies.get("token");
    if (token) {
      validateToken(token)
        .then((valid) => {
          if (!valid) {
            router.push("/login");
          } else {
            setIsInitializing(true);
            isInitializedRef.current = true;
            const initializeGame = async () => {
              try {
                setErrorMessage(null);
                const messageResponse = await dispatch(
                  sendMessageFirst(formattedGameScene)
                );
                if (sendMessageFirst.fulfilled.match(messageResponse)) {
                  const responseMessage = messageResponse.payload.message;
                  setCurrentMessage(responseMessage);
                  setHistory("");
                  setHistory((prev) => prev + responseMessage);
                  setIsInitializing(false);
                } else if (sendMessageFirst.rejected.match(messageResponse)) {
                  setErrorMessage("Ошибка при загрузке истории. Попробуйте обновить страницу.");
                  setIsInitializing(false);
                }
              } catch (error) {
                setErrorMessage("Произошла ошибка при инициализации игры.");
                setIsInitializing(false);
              }
            };
            initializeGame();
          }
        })
        .catch(() => {
          router.push("/login");
        });
    } else {
      router.push("/login");
    }
  }, [router, formattedGameScene, dispatch]);

  useEffect(() => {
    if (history !== historyRef.current) {
      historyRef.current = history;
      const lines = history.split("\n").filter((line) => line.trim() !== "");
      if (isMountedRef.current) {
        setDisplayedHistory(lines);
      }
    }
  }, [history]);

  const fetchData = useCallback(async () => {
    try {
      setIsInitializing(true);
      setErrorMessage(null);
      const messageResponse = await dispatch(
        sendMessageFirst(formattedGameScene)
      );
      if (sendMessageFirst.fulfilled.match(messageResponse)) {
        const responseMessage = messageResponse.payload.message;
        setCurrentMessage(responseMessage);
        setHistory("");
        setHistory((prev) => prev + responseMessage);
        setIsInitializing(false);
      } else if (sendMessageFirst.rejected.match(messageResponse)) {
        setErrorMessage("Ошибка при загрузке истории. Попробуйте обновить страницу.");
        setIsInitializing(false);
      }
    } catch (error) {
      setErrorMessage("Произошла ошибка при инициализации игры.");
      setIsInitializing(false);
    }
  }, [dispatch, formattedGameScene]);

  const handleGetActions = useCallback(async () => {
    if (!currentMessage) {
      setErrorMessage("Нет сообщения для получения действий.");
      return;
    }
    try {
      setErrorMessage(null);
      const resultAction = await dispatch(getActions(currentMessage));
      if (getActions.fulfilled.match(resultAction)) {
        if (resultAction.payload && resultAction.payload.length > 0) {
          setModalOpen(true);
        } else {
          setErrorMessage("Действия не найдены. Попробуйте продолжить историю.");
        }
      } else if (getActions.rejected.match(resultAction)) {
        setErrorMessage("Ошибка при получении действий.");
      }
    } catch (error) {
      setErrorMessage("Произошла ошибка при получении действий.");
    }
  }, [dispatch, currentMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) {
      setErrorMessage("Введите текст действия.");
      return;
    }
    if (!currentMessage) {
      setErrorMessage("Ошибка: нет текущего сообщения.");
      return;
    }
    try {
      setLoadingSendMessage(true);
      setErrorMessage(null);
      const resultAction = await dispatch(
        sendMessage({
          message: currentMessage,
          prompt: `Вы ${chooseAction}: ` + inputValue.trim(),
        })
      );
      if (sendMessage.fulfilled.match(resultAction)) {
        const responseMessage = resultAction.payload.initial;
        const actionText =
          chooseAction === "Сказать"
            ? "решили сказать"
            : chooseAction === "Событие"
            ? "вызвали событие"
            : "выбрали действие";
        const formattedInputValue =
          inputValue.trim().charAt(0).toUpperCase() + inputValue.trim().slice(1);
        setHistory(
          (prev) =>
            prev +
            "\n\n" +
            `<p class="${styles.whiteText}">Вы ${actionText}: ${formattedInputValue} </p>` +
            "\n" +
            responseMessage
        );
        setCurrentMessage(responseMessage);
        setInputValue("");
        setLoadingSendMessage(false);
      } else if (sendMessage.rejected.match(resultAction)) {
        setErrorMessage("Ошибка при отправке сообщения. Попробуйте еще раз.");
        setLoadingSendMessage(false);
      }
    } catch (error) {
      setErrorMessage("Произошла ошибка при отправке сообщения.");
      setLoadingSendMessage(false);
    }
  }, [dispatch, inputValue, currentMessage, chooseAction]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loadingSendMessage) {
        handleSendMessage();
      }
    }
  }, [handleSendMessage, loadingSendMessage]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const handleActionSelect = useCallback((action: string) => {
    setChooseAction(action);
    setDropdownOpen(false);
  }, []);

  const handleActionClick = useCallback(async (action: string) => {
    if (!currentMessage) {
      setErrorMessage("Ошибка: нет текущего сообщения.");
      return;
    }
    setModalOpen(false);
    try {
      setLoadingSendMessage(true);
      setErrorMessage(null);
      const resultAction = await dispatch(
        sendMessage({
          message: currentMessage,
          prompt: `Вы выбрали действие: ${action.trim()}`,
        })
      );
      if (sendMessage.fulfilled.match(resultAction)) {
        const responseMessage = resultAction.payload.initial;
        setHistory(
          (prev) =>
            prev +
            "\n\n" +
            `<p class="${styles.whiteText}">Вы выбрали действие: ${action.trim()} </p>` +
            "\n" +
            responseMessage
        );
        setCurrentMessage(responseMessage);
        setLoadingSendMessage(false);
      } else if (sendMessage.rejected.match(resultAction)) {
        setErrorMessage("Ошибка при отправке действия. Попробуйте еще раз.");
        setLoadingSendMessage(false);
      }
    } catch (error) {
      setErrorMessage("Произошла ошибка при отправке действия.");
      setLoadingSendMessage(false);
    }
  }, [dispatch, currentMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.gameContent}>
        <h1 className={styles.header}>
          Игровой сценарий: {formattedGameScene}
        </h1>
        <div className={styles.historyArea}>
          {isInitializing && !history && (
            <TypeIt
              key={`loading-init-${isInitializing}`}
              options={{ speed: 50, cursor: false }}
              getBeforeInit={(instance) => {
                instance.type("Загружаем историю...");
                return instance;
              }}
            />
          )}
          {errorMessage && (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>{errorMessage}</p>
            </div>
          )}
          {displayedHistory.map((msg, index) => {
            if (!msg.trim()) return null;
            const hasHtml = /<[^>]+>/.test(msg);
            const cleanedMsg = msg
              .replace(/^###\s*История:\s*/i, '')
              .replace(/^###\s*/g, '')
              .replace(/Продолжение игры \(ответ игрока\):/i, '')
              .trim();
            
            if (!cleanedMsg) return null;
            
            return (
              <div key={`history-${index}-${cleanedMsg.substring(0, 30)}-${displayedHistory.length}`} className={styles.historyMessage}>
                <TypeIt
                  key={`typeit-${index}-${displayedHistory.length}-${cleanedMsg.substring(0, 20)}`}
                  options={{ speed: 10, cursor: false, html: hasHtml }}
                  getBeforeInit={(instance) => {
                    if (hasHtml) {
                      instance.type(cleanedMsg, { html: true });
                    } else {
                      instance.type(cleanedMsg);
                    }
                    return instance;
                  }}
                />
              </div>
            );
          })}
          {loadingSendMessage && (
            <TypeIt
              key={`loading-continuation-${Date.now()}`}
              options={{ speed: 30, cursor: false }}
              className={styles.whiteText}
              getBeforeInit={(instance) => {
                instance.type("Печатаем продолжение истории...");
                return instance;
              }}
            />
          )}
        </div>
        <div className={styles.inputContainer}>
          <button
            className={styles.getActionsButton}
            onClick={handleGetActions}
            disabled={loadingSendMessage || isInitializing || !currentMessage}
            aria-label="Получить предложенные действия"
            title="Получить предложенные действия от ИИ"
          >
            💡 Действия
          </button>
          <div className={styles.actionButtonWrapper} ref={dropdownRef}>
            <button 
              className={styles.actionButton} 
              onClick={toggleDropdown}
              disabled={loadingSendMessage || isInitializing}
              aria-label="Выбрать тип действия"
            >
              {chooseAction} ▼
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdown}>
                <div
                  className={styles.dropdownItem}
                  onClick={() => handleActionSelect("Сделать")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleActionSelect("Сделать");
                    }
                  }}
                >
                  Сделать
                </div>
                <div
                  className={styles.dropdownItem}
                  onClick={() => handleActionSelect("Сказать")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleActionSelect("Сказать");
                    }
                  }}
                >
                  Сказать
                </div>
                <div
                  className={styles.dropdownItem}
                  onClick={() => handleActionSelect("Событие")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleActionSelect("Событие");
                    }
                  }}
                >
                  Событие
                </div>
              </div>
            )}
          </div>
          <textarea
            className={styles.inputField}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="Введите текст действия..."
            onKeyDown={handleKeyDown}
            disabled={loadingSendMessage || isInitializing}
            aria-label="Поле ввода действия"
          />
          <button 
            className={styles.sendButton} 
            onClick={handleSendMessage}
            disabled={loadingSendMessage || isInitializing || !inputValue.trim()}
            aria-label="Отправить сообщение"
          >
            {loadingSendMessage ? "Отправка..." : "Отправить"}
          </button>
        </div>
        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Выберите действие</h2>
              {loading && <p className={styles.modalLoading}>Загрузка действий...</p>}
              {error && <p className={styles.modalError}>{error}</p>}
              {actions && actions.length > 0 ? (
                <div className={styles.actionsList}>
                  {actions.map((action: string, index: number) => {
                    const trimmedAction = action.trim();
                    if (!trimmedAction) return null;
                    return (
                      <button
                        key={`action-${index}-${trimmedAction.substring(0, 10)}`}
                        className={styles.modalActionButton}
                        onClick={() => handleActionClick(trimmedAction)}
                        disabled={loadingSendMessage}
                      >
                        {trimmedAction}
                      </button>
                    );
                  })}
                </div>
              ) : (
                !loading && (
                  <p className={styles.modalEmpty}>
                    Действия не найдены. Попробуйте ввести свое действие.
                  </p>
                )
              )}
              {imagePath && (
                <div className={styles.modalImageContainer}>
                  <img 
                    src={imagePath} 
                    alt="Сгенерированное изображение" 
                    className={styles.modalImage}
                  />
                </div>
              )}
              <button 
                className={styles.modalCloseButton} 
                onClick={closeModal}
                aria-label="Закрыть модальное окно"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Game;
