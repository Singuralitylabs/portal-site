"use client";

import { useState } from "react";
import { Button, Input, Select, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { Search } from "lucide-react";
import { DEFAULT_VIDEO_FILTERS, VIDEO_SORT_OPTIONS, type VideoFilters } from "../utils";

interface VideoFilterBarProps {
  filters: VideoFilters;
  onChange: (changes: Partial<VideoFilters>) => void;
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

export function VideoFilterBar({ filters, onChange }: VideoFilterBarProps) {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [rangeInvalid, setRangeInvalid] = useState(false);

  function changeRange(next: DateRange) {
    setRange(next);
    const start = next.start ? dayjs(next.start).format("YYYY-MM-DD") : null;
    const end = next.end ? dayjs(next.end).format("YYYY-MM-DD") : null;
    const invalid = !!start && !!end && start > end;
    setRangeInvalid(invalid);
    if (!invalid) onChange({ start, end });
  }

  return (
    <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-3 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]">
      <TextInput
        label="動画の検索"
        leftSection={<Search size={16} aria-hidden="true" />}
        value={filters.query}
        onChange={event => onChange({ query: event.currentTarget.value })}
        className="col-span-2 sm:col-span-1"
      />
      <DatePickerInput
        label="収録日（開始）"
        value={range.start}
        onChange={start => changeRange({ ...range, start })}
        valueFormat="YYYY-MM-DD"
        clearable
        clearButtonProps={{ "aria-label": "開始日をクリア" }}
      />
      <DatePickerInput
        label="収録日（終了）"
        value={range.end}
        onChange={end => changeRange({ ...range, end })}
        valueFormat="YYYY-MM-DD"
        clearable
        clearButtonProps={{ "aria-label": "終了日をクリア" }}
        error={rangeInvalid}
        aria-describedby={rangeInvalid ? "video-date-range-error" : undefined}
      />
      <Select
        label="動画の並び順"
        data={[...VIDEO_SORT_OPTIONS]}
        allowDeselect={false}
        value={filters.sort}
        onChange={value => {
          const option = VIDEO_SORT_OPTIONS.find(({ value: sort }) => sort === value);
          if (option) onChange({ sort: option.value });
        }}
      />
      <Select
        label="表示単位"
        data={[
          { value: "grouped", label: "カテゴリー別" },
          { value: "all", label: "すべてのカテゴリー" },
        ]}
        allowDeselect={false}
        value={filters.acrossCategories ? "all" : "grouped"}
        onChange={value => onChange({ acrossCategories: value === "all" })}
      />
      <Button
        variant="default"
        className="mt-6 justify-self-start"
        onClick={() => {
          setRange({ start: null, end: null });
          setRangeInvalid(false);
          onChange(DEFAULT_VIDEO_FILTERS);
        }}
      >
        条件をクリア
      </Button>
      {rangeInvalid && (
        <Input.Error id="video-date-range-error" role="alert" className="col-span-full">
          開始日は終了日以前の日付を指定してください。
        </Input.Error>
      )}
    </div>
  );
}
