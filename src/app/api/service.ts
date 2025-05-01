'use server'
import { neon } from "@neondatabase/serverless";

export async function getData() {
    if (!process.env?.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
    }
    const sql = neon(process.env.DATABASE_URL);
    const data = await sql`SELECT * FROM black_jack;`;
    return data;
}

// 获取用户分数
export async function getUserScore(walletAddress: string) {
    if (!process.env?.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
    }
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
        SELECT score FROM black_jack_score 
        WHERE wallet_address = ${walletAddress}
    `;
    return result[0]?.score || 0;
}

// 更新用户分数
export async function updateUserScore(walletAddress: string, score: number) {
    if (!process.env?.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
    }
    const sql = neon(process.env.DATABASE_URL);
    await sql`
        INSERT INTO black_jack_score (wallet_address, score)
        VALUES (${walletAddress}, ${score})
        ON CONFLICT (wallet_address) 
        DO UPDATE SET 
            score = ${score},
            updated_at = CURRENT_TIMESTAMP
    `;
}

// 获取排行榜
export async function getLeaderboard(limit: number = 10) {
    if (!process.env?.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
    }
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
        SELECT wallet_address, score 
        FROM black_jack_score 
        ORDER BY score DESC 
        LIMIT ${limit}
    `;
    return result;
}