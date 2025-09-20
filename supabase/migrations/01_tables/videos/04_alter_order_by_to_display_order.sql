--  order_byカラムをdisplay_orderに変更
ALTER TABLE videos
RENAME COLUMN order_by TO display_order;
