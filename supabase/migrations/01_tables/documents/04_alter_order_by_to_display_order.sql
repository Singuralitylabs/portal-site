--  order_byカラムをdisplay_orderに変更
ALTER TABLE documents
RENAME COLUMN order_by TO display_order;
