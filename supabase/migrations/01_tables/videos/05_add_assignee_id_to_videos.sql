-- videosテーブルにassignee_idカラムを追加
alter table videos
  add column assignee_id INTEGER;

alter table videos
  add constraint videos_assignee_fk
    foreign key (assignee_id)
    references users(id)
    on delete set null;

create index idx_videos_assignee_id
  on videos(assignee_id);