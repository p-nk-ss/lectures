import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { groupBanks } from '../../../../lib/banks';

/**
 * The question bank for one quiz, served as its own file.
 *
 * It is deliberately not a prop of the island: a bank of sixty questions would be inlined
 * into the page HTML, parsed on hydration, and paid for by every visit — including the
 * ones that never press ПОЧАТИ. Here it is fetched while the reader is on the rules panel.
 */
export const getStaticPaths: GetStaticPaths = async () =>
  groupBanks(await getCollection('quizzes')).map((b) => ({
    params: { topic: b.topic, level: b.level },
    props: { questions: b.questions },
  }));

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify({ questions: props.questions }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
