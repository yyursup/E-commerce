-- ==============================================================================
-- Trigger tự động tăng sold_count trong bảng products khi đơn hàng hoàn thành (COMPLETED)
-- Phân công: Người 3 - Social Commerce & Real Metrics (Tương tác & Chỉ số)
-- ==============================================================================

-- 1. Hàm trigger xử lý
CREATE OR REPLACE FUNCTION trigger_update_sold_count_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ kích hoạt khi đơn hàng chuyển sang trạng thái COMPLETED
    IF (NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED')) THEN
        UPDATE products p
        SET sold_count = COALESCE(p.sold_count, 0) + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Đăng ký trigger trên bảng orders
DROP TRIGGER IF EXISTS trg_order_completed_update_sold_count ON orders;

CREATE TRIGGER trg_order_completed_update_sold_count
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_update_sold_count_func();
