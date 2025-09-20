--  order_byカラムをdisplay_orderに変更
ALTER TABLE categories
RENAME COLUMN order_by TO display_order;
