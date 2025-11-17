"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./BuySub.module.css";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { backendApiUrl } from "@/src/utils/backendApiUrl";
import Header from "../Header/Header";
import { useToast } from "@/src/hooks/useToast";

interface Subscription {
  id: number;
  name: string;
  price: number;
  description: string;
}

const BuySub: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get<Subscription[]>(
          `${backendApiUrl}/subscription`
        );
        setSubscriptions(response.data);
      } catch (error) {
        console.error("Ошибка при получении подписок:", error);
      } finally {
        setLoading(false); // Устанавливаем состояние загрузки в false после завершения
      }
    };
    fetchSubscriptions();
  }, []);

  const handleCheckboxChange = (id: number) => {
    setSelectedSubscriptionId(id);
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePurchase = async () => {
    const token = Cookies.get("token");
    if (!token || selectedSubscriptionId === null) {
      showToast("Пожалуйста, выберите подписку и войдите в систему.", "error");
      return;
    }
    
    const selectedSub = subscriptions.find(sub => sub.id === selectedSubscriptionId);
    if (!selectedSub) {
      showToast("Выбранная подписка не найдена.", "error");
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    const token = Cookies.get("token");
    if (!token || selectedSubscriptionId === null) {
      return;
    }
    
    setShowConfirmModal(false);
    setPurchasing(true);
    
    try {
      const response = await axios.post(
        `${backendApiUrl}/subscription/purchase/${selectedSubscriptionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        showToast("Подписка успешно приобретена!", "success");
        setTimeout(() => {
          router.push("/profile");
        }, 1000);
      } else {
        showToast("Ошибка при покупке подписки: " + response.data.message, "error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Неизвестная ошибка";
      showToast("Ошибка при покупке подписки: " + errorMessage, "error");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Загрузка подписок...</p>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.header}>Выберите подписку</h1>
        <div className={styles.subscriptionList}>
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className={styles.subscriptionItem}>
              <input
                type="checkbox"
                id={`subscription-${subscription.id}`}
                name="subscription"
                value={subscription.id}
                onChange={() => handleCheckboxChange(subscription.id)}
              />
              <label htmlFor={`subscription-${subscription.id}`}>
                <h2>{subscription.name}</h2>
                <p>Цена: {subscription.price} руб.</p>
                <p>Описание: {subscription.description}</p>
              </label>
            </div>
          ))}
        </div>
        <button className={styles.purchaseButton} onClick={handlePurchase} disabled={loading || purchasing || selectedSubscriptionId === null}>
          {purchasing ? "Обработка..." : "Купить подписку"}
        </button>
      </div>
      {showConfirmModal && selectedSubscriptionId && (
        <div className={styles.confirmModalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.confirmModalTitle}>Подтверждение покупки</h2>
            <p className={styles.confirmModalText}>
              Вы уверены, что хотите приобрести подписку "{subscriptions.find(s => s.id === selectedSubscriptionId)?.name}" 
              за {subscriptions.find(s => s.id === selectedSubscriptionId)?.price} руб.?
            </p>
            <div className={styles.confirmModalButtons}>
              <button className={styles.confirmButton} onClick={confirmPurchase} disabled={purchasing}>
                {purchasing ? "Обработка..." : "Подтвердить"}
              </button>
              <button className={styles.cancelButton} onClick={() => setShowConfirmModal(false)} disabled={purchasing}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default BuySub;
