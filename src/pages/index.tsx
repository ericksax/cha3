import { GetStaticProps } from 'next';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formattedPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        parseISO(post.first_publication_date),
        'PP',
        { locale: ptBR }
      ),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formattedPosts);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }
    const response = await (await fetch(`${postsPagination.next_page}`)).json();
    setNextPage(response.next_page);
    setCurrentPage(response.page);

    const responsePost = response.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          parseISO(post.first_publication_date),
          'PP',
          { locale: ptBR }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...responsePost]);
  }

  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.content}>
          {posts.map(post => {
            return (
              <Link key={post.uid} href={`post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <aside>
                    <FiCalendar />
                    <time>{post.first_publication_date}</time>
                    <FiUser />
                    <p className={styles.author}>{post.data.author}</p>
                  </aside>
                </a>
              </Link>
            );
          })}
          {nextPage && (
            <button onClick={handleNextPage} type="button">
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],

    {
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    results: posts,
    next_page: postsResponse.next_page,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60,
  };
};
