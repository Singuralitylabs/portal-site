"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Text, type TextProps } from "@mantine/core";

interface MarkdownTextProps extends Omit<TextProps, "children"> {
    children: string | null | undefined;
    enableGfm?: boolean;
}

/**
 * マークダウンテキスト表示コンポーネント
 *
 * @param children - マークダウン形式のテキスト
 * @param enableGfm - GitHub Flavored Markdownを有効にするか (default: true)
 * @param className - 追加のCSSクラス
 * @param textProps - Mantine TextコンポーネントのProps
 *
 * @security
 * - react-markdownがデフォルトでHTMLタグをエスケープ
 * - 外部リンクに rel="noopener noreferrer" を自動付与
 */
export const MarkdownText = memo(
    ({ children, enableGfm = true, className, ...textProps }: MarkdownTextProps) => {
        if (!children) {
            return (
                <Text
                    component="div"
                    className={`prose prose-sm max-w-none ${className || ""}`}
                    {...textProps}
                />
            );
        }

        return (
            <Text
                component="div"
                className={`prose prose-sm max-w-none ${className || ""}`}
                {...textProps}
            >
                <ReactMarkdown
                    remarkPlugins={enableGfm ? [remarkGfm] : []}
                    components={{
                        // リンクの安全性チェック
                        a: ({ ...props }) => {
                            const href = props.href || "";

                            // 危険なスキームまたは空のhrefをブロック
                            const isDangerous =
                                !href || // 空のhref
                                href.startsWith("javascript:") ||
                                href.startsWith("data:") ||
                                href.startsWith("vbscript:") ||
                                href.startsWith("file:") ||
                                href.trim() === "" || // 空白のみ
                                href === "#"; // ハッシュのみ

                            if (isDangerous) {
                                // 危険なリンクは無効化
                                return (
                                    <span
                                        style={{
                                            textDecoration: "underline",
                                            color: "inherit",
                                            opacity: 0.6,
                                            cursor: "not-allowed",
                                        }}
                                        title="このリンクはセキュリティ上の理由でブロックされました"
                                    >
                                        {props.children}
                                    </span>
                                );
                            }

                            // 安全なリンクのみ有効化
                            return (
                                <a {...props} target="_blank" rel="noopener noreferrer" />
                            );
                        },
                    }}
                >
                    {children}
                </ReactMarkdown>
            </Text>
        );
    }
);

MarkdownText.displayName = "MarkdownText";