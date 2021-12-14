import Link from 'next/link';
import styles from './header.module.scss';
import commonStyles from '../../styles/common.module.scss';

export default function Header(): JSX.Element {
  return (
    <Link href="/">
      <a>
        <div className={`${styles.content} ${commonStyles.container}`}>
          <img src="Logo.svg" width="249,69px" height="24,67" alt="logo" />
        </div>
      </a>
    </Link>
  );
}
