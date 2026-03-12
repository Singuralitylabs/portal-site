-- documentsテーブルにassignee_idカラムを追加
alter table documents
  add column assignee_id INTEGER;

alter table documents
  add constraint documents_assignee_fk
    foreign key (assignee_id)
    references users(id)
    on delete set null;

create index idx_documents_assignee_id
  on documents(assignee_id);