/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { getPrismicClient } from '../../services/prismic';

// import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));

    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  const formateDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <img className={styles.imagem} src={post.data.banner.url} alt="banner" />
      <div className={styles.container}>
        <main className={styles.content}>
          <strong>{post.data.title}</strong>
          <aside>
            <time>
              <FiCalendar />
              {formateDate}
            </time>

            <p className={styles.author}>
              <FiUser />
              {post.data.author}
            </p>
            <p>
              <FiClock />
              {`${readTime} min`}
            </p>
          </aside>
          {post.data.content.map(content => {
            return (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            );
          })}
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(postContent => {
    return {
      params: {
        slug: postContent.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(item => {
        return {
          heading: item.heading,
          body: [...item.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60,
  };
};
