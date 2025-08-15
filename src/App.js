import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  Alert,
  Card,
  Button,
  Modal,
  Spinner,
  Toast,
  ToastContainer,
  Container,
  Row,
  Col,
  Form,
  Badge,
  ButtonGroup,
  Offcanvas,
  Navbar,
  Nav,
  NavDropdown
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  IconButton, 
  Fab, 
  Zoom,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EditIcon from '@mui/icons-material/Edit';
import AlarmOffIcon from '@mui/icons-material/AlarmOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GridViewIcon from '@mui/icons-material/GridView';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';

const GradientPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(3),
  borderRadius: '20px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
}));

const StatusCard = styled(Card)(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'alarm': return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      case 'stored': return 'linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)';
      case 'reserved': return 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)';
      default: return 'linear-gradient(135deg, #ddd6fe 0%, #c7d2fe 100%)';
    }
  };
  
  return {
    background: getStatusColor(),
    border: 'none',
    borderRadius: '15px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
    }
  };
});

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  borderRadius: '25px',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  }
}));

function App() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBox, setEditingBox] = useState(null);
  const [tempItemData, setTempItemData] = useState({
    itemName: '',
    stored: false,
    reservedTime: '',
    photoUrl: null
  });
  const [alarmMessages, setAlarmMessages] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [filter, setFilter] = useState('all');
  const [itemTypes, setItemTypes] = useState(['지갑', '스마트폰', '열쇠', '약', '마스크']);
  const [newItemType, setNewItemType] = useState('');
  const [showItemTypeModal, setShowItemTypeModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stompClientRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        console.log('🔗 WebSocket 연결됨');
        client.subscribe('/topic/alarm', (message) => {
          const alarm = JSON.parse(message.body);
          const msg = `🚨 ${alarm.boxNumber + 1}번 칸 (${alarm.itemName}) 알람 발생!`;
          setAlarmMessages(prev => [...prev, msg]);
          setShowToast(true);
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
          }
          fetchBoxes();
        });
      },
      onDisconnect: () => {
        console.log('🔌 WebSocket 연결 해제됨');
      },
      debug: str => console.log('STOMP:', str),
      reconnectDelay: 5000,
    });
    
    client.activate();
    stompClientRef.current = client;

    fetchBoxes();
    const interval = setInterval(fetchBoxes, 10000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timer);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  const fetchBoxes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/boxes');
      setBoxes(res.data);
    } catch (error) {
      console.error('박스 데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBox = async () => {
    try {
      const updatedBox = {
        ...editingBox,
        itemName: tempItemData.itemName,
        stored: tempItemData.stored,
        reservedTime: tempItemData.reservedTime || null,
        photoUrl: tempItemData.photoUrl,  // ✅ 촬영한 사진 데이터 포함
        alarmOn: editingBox.alarmOn
      };

      await axios.post(`http://localhost:8080/api/boxes/${editingBox.boxNumber}`, updatedBox);
      setEditingBox(null);
      setTempItemData({ itemName: '', stored: false, reservedTime: '', photoUrl: null });
      stopCamera();
      fetchBoxes();
    } catch (error) {
      console.error('박스 업데이트 실패:', error);
      alert('박스 업데이트에 실패했습니다.');
    }
  };

  const clearAlarm = async (boxNumber) => {
    try {
      await axios.post(`http://localhost:8080/api/boxes/${boxNumber}/clear-alarm`);
      fetchBoxes();
    } catch (error) {
      console.error('알람 해제 실패:', error);
      alert('알람 해제에 실패했습니다.');
    }
  };

  const addItemType = () => {
    if (newItemType.trim() && !itemTypes.includes(newItemType.trim())) {
      setItemTypes([...itemTypes, newItemType.trim()]);
      setNewItemType('');
      setShowItemTypeModal(false);
    }
  };

  const removeItemType = (itemType) => {
    setItemTypes(itemTypes.filter(type => type !== itemType));
  };

  const filteredBoxes = boxes.filter(box => {
    if (filter === 'alarm') return box.alarmOn;
    if (filter === 'stored') return box.stored;
    if (filter === 'reserved') return box.reservedTime;
    return true;
  });

  const handleEditBox = (box) => {
    setEditingBox(box);
    setTempItemData({
      itemName: box.itemName || '',
      stored: box.stored,
      reservedTime: box.reservedTime ? dayjs(box.reservedTime).format('YYYY-MM-DDTHH:mm') : '',
      photoUrl: box.photoUrl || null
    });
  };

  // 웹캠 관련 함수들
  const startCamera = async () => {
    try {
      console.log('카메라 시작 시도...');
      
      // 기존 스트림이 있다면 정리
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log('기존 트랙 정지:', track.kind, track.label);
          track.stop();
        });
        setStream(null);
      }

      // 다양한 해상도 옵션으로 시도
      const constraints = {
        video: {
          width: { ideal: 1280, min: 320, max: 1920 },
          height: { ideal: 720, min: 240, max: 1080 },
          frameRate: { ideal: 30, min: 15, max: 60 },
          facingMode: 'environment' // 후면 카메라 우선 (없으면 전면)
        },
        audio: false
      };

      console.log('미디어 스트림 요청 중...', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('스트림 획득 성공:', mediaStream);
      console.log('비디오 트랙:', mediaStream.getVideoTracks());
      
      // 비디오 트랙 상태 확인
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('비디오 트랙을 찾을 수 없습니다.');
      }
      
      const videoTrack = videoTracks[0];
      console.log('비디오 트랙 설정:', videoTrack.getSettings());
      console.log('비디오 트랙 상태:', {
        enabled: videoTrack.enabled,
        muted: videoTrack.muted,
        readyState: videoTrack.readyState
      });

      setStream(mediaStream);
      setShowCamera(true);

      // 비디오 엘리먼트 설정을 다음 틱에서 실행
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          console.log('비디오 엘리먼트에 스트림 설정...');
          videoRef.current.srcObject = mediaStream;
          
          // 비디오 속성 설정
          videoRef.current.playsInline = true;
          videoRef.current.muted = true;
          videoRef.current.autoplay = true;
          
          // 다양한 이벤트 리스너 추가
          videoRef.current.onloadstart = () => console.log('비디오 로딩 시작');
          videoRef.current.onloadeddata = () => console.log('비디오 데이터 로드됨');
          videoRef.current.oncanplay = () => {
            console.log('비디오 재생 가능');
            console.log('비디오 크기:', {
              videoWidth: videoRef.current.videoWidth,
              videoHeight: videoRef.current.videoHeight,
              clientWidth: videoRef.current.clientWidth,
              clientHeight: videoRef.current.clientHeight
            });
          };
          videoRef.current.onplay = () => console.log('비디오 재생 시작');
          videoRef.current.onerror = (e) => console.error('비디오 에러:', e);
          
          // 강제 재생 시도
          videoRef.current.play()
            .then(() => {
              console.log('비디오 재생 성공');
              // 3초 후에도 검은 화면이면 다시 시도
              setTimeout(() => {
                if (videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0)) {
                  console.warn('비디오 크기가 0입니다. 다시 시도합니다.');
                  restartCamera();
                }
              }, 3000);
            })
            .catch(e => {
              console.error('비디오 재생 실패:', e);
              // 사용자 제스처가 필요한 경우를 위한 재시도
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(console.error);
                }
              }, 1000);
            });
        }
      }, 100);

    } catch (err) {
      console.error('카메라 접근 실패:', err);
      
      let errorMessage = '카메라에 접근할 수 없습니다.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '카메라가 이미 다른 애플리케이션에서 사용 중입니다.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = '요청한 카메라 설정을 지원하지 않습니다. 다른 설정으로 시도합니다.';
        // 더 간단한 설정으로 재시도
        setTimeout(() => trySimpleCamera(), 1000);
        return;
      }
      
      alert(errorMessage);
    }
  };

  // 간단한 설정으로 재시도하는 함수
  const trySimpleCamera = async () => {
    try {
      console.log('간단한 카메라 설정으로 재시도...');
      const simpleConstraints = {
        video: true, // 기본 설정만 사용
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('간단한 설정으로도 실패:', error);
      alert('카메라를 시작할 수 없습니다. 브라우저나 시스템 설정을 확인해주세요.');
    }
  };

  // 카메라 재시작 함수
  const restartCamera = async () => {
    console.log('카메라 재시작 중...');
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  const stopCamera = () => {
    console.log('카메라 정지 중...');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('트랙 정지:', track.kind, track.label, track.readyState);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // 비디오 엘리먼트 리셋
    }
    
    setShowCamera(false);
    console.log('카메라 정지 완료');
  };

  const capturePhoto = () => {
    console.log('사진 촬영 시도...');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      alert('카메라가 준비되지 않았습니다.');
      return;
    }
    
    // 비디오 상태 상세 체크
    console.log('비디오 상태:', {
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      paused: video.paused,
      currentTime: video.currentTime,
      duration: video.duration
    });
    
    // 비디오가 재생 중이고 데이터가 있는지 확인
    if (video.readyState < 2) {
      alert('카메라 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('비디오 크기가 0입니다. 카메라 재시작을 시도합니다.');
      restartCamera();
      return;
    }
    
    // 실제 비디오 크기 가져오기
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    console.log('캡처할 비디오 크기:', { videoWidth, videoHeight });
    
    // 캔버스 크기 설정
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    const context = canvas.getContext('2d');
    
    try {
      // 비디오 프레임을 캔버스에 그리기
      context.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      // 캔버스에 실제로 그려졌는지 확인
      const imageData = context.getImageData(0, 0, videoWidth, videoHeight);
      const data = imageData.data;
      
      // 모든 픽셀이 검은색(0,0,0)인지 확인
      let isAllBlack = true;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
          isAllBlack = false;
          break;
        }
      }
      
      if (isAllBlack) {
        console.warn('캡처된 이미지가 모두 검은색입니다.');
        alert('카메라 영상이 검은 화면입니다. 다른 앱에서 카메라를 사용하고 있는지 확인하거나 카메라를 재시작해보세요.');
        return;
      }
      
      // 캔버스를 base64 이미지로 변환
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // 유효한 이미지 데이터인지 확인
      if (photoDataUrl && photoDataUrl !== 'data:,') {
        setTempItemData({...tempItemData, photoUrl: photoDataUrl});
        stopCamera();
        console.log('사진 촬영 완료');
      } else {
        alert('사진 촬영에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('사진 변환 실패:', error);
      alert('사진 처리 중 오류가 발생했습니다.');
    }
  };

  // 디버깅을 위한 카메라 정보 확인 함수
  const checkCameraInfo = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('사용 가능한 카메라 목록:');
      videoDevices.forEach((device, index) => {
        console.log(`${index + 1}. ${device.label || '카메라 ' + (index + 1)} (${device.deviceId})`);
      });
      
      if (videoDevices.length === 0) {
        console.warn('사용 가능한 카메라가 없습니다.');
      }
      
      // 브라우저 지원 여부 확인
      console.log('getUserMedia 지원:', !!navigator.mediaDevices?.getUserMedia);
      console.log('현재 URL 프로토콜:', window.location.protocol);
      
    } catch (error) {
      console.error('카메라 정보 확인 실패:', error);
    }
  };

  // 컴포넌트 마운트 시 카메라 정보 확인
  useEffect(() => {
    checkCameraInfo();
  }, []);

  const removePhoto = () => {
    setTempItemData({...tempItemData, photoUrl: null});
  };

  const getBoxStatus = (box) => {
    if (box.alarmOn) return 'alarm';
    if (box.stored) return 'stored';
    if (box.reservedTime) return 'reserved';
    return 'empty';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'alarm': return <NotificationsActiveIcon />;
      case 'stored': return <InventoryIcon />;
      case 'reserved': return <AccessTimeIcon />;
      default: return <StorageIcon />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'alarm': return '🚨 알람';
      case 'stored': return '📦 보관중';
      case 'reserved': return '⏰ 예약됨';
      default: return '📭 비어있음';
    }
  };

  const columns = [
    { 
      field: 'boxNumber', 
      headerName: '번호', 
      width: 80,
      renderCell: (params) => (
        <Avatar sx={{ bgcolor: '#667eea', width: 35, height: 35, fontSize: '0.9rem' }}>
          {params.row.boxNumber + 1}
        </Avatar>
      )
    },
    { 
      field: 'itemName', 
      headerName: '물건 이름', 
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          {params.row.photoUrl && (
            <Avatar 
              src={params.row.photoUrl} 
              sx={{ width: 35, height: 35, mr: 1 }}
              variant="rounded"
            />
          )}
          <Typography variant="body2" fontWeight="500">
            {params.row.itemName || '없음'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'stored',
      headerName: '보관 상태',
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          icon={params.row.stored ? <CheckCircleIcon /> : <StorageIcon />}
          label={params.row.stored ? '보관중' : '비어있음'}
          color={params.row.stored ? 'success' : 'default'}
          variant="filled"
        />
      ),
    },
    {
      field: 'reservedTime',
      headerName: '예약 시간',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.row.reservedTime ? dayjs(params.row.reservedTime).format('MM-DD HH:mm') : '없음'}
        </Typography>
      ),
    },
    {
      field: 'alarmOn',
      headerName: '알람 상태',
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          icon={params.row.alarmOn ? <NotificationsActiveIcon /> : <CheckCircleIcon />}
          label={params.row.alarmOn ? '알람' : '정상'}
          color={params.row.alarmOn ? 'error' : 'success'}
          variant="filled"
        />
      ),
    },
    {
      field: 'actions',
      headerName: '동작',
      width: 150,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleEditBox(params.row)}
          >
            <EditIcon />
          </IconButton>
          {params.row.alarmOn && (
            <IconButton
              color="error"
              size="small"
              onClick={() => clearAlarm(params.row.boxNumber)}
            >
              <AlarmOffIcon />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  const stats = {
    total: boxes.length,
    stored: boxes.filter(b => b.stored).length,
    reserved: boxes.filter(b => b.reservedTime).length,
    alarm: boxes.filter(b => b.alarmOn).length
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      pb: 4
    }}>
      {/* 상단 네비게이션 바 */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-lg" style={{ 
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%) !important',
        borderBottom: '3px solid #3498db'
      }}>
        <Container fluid>
          <Navbar.Brand href="#" className="fw-bold fs-4">
            <SchoolIcon sx={{ fontSize: 30, mr: 1, color: '#3498db' }} />
            <span style={{ color: '#3498db' }}>Smart</span>School
            <Badge bg="success" className="ms-2 fs-6">IoT</Badge>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#" active>
                <HomeIcon sx={{ fontSize: 18, mr: 1 }} />
                스마트 박스
              </Nav.Link>
              <Nav.Link href="#">
                <DashboardIcon sx={{ fontSize: 18, mr: 1 }} />
                대시보드
              </Nav.Link>
              <NavDropdown title={
                <span>
                  <SettingsIcon sx={{ fontSize: 18, mr: 1 }} />
                  설정
                </span>
              } id="basic-nav-dropdown">
                <NavDropdown.Item onClick={() => setShowItemTypeModal(true)}>
                  <TuneIcon sx={{ fontSize: 16, mr: 1 }} />
                  물건 종류 관리
                </NavDropdown.Item>
                <NavDropdown.Item href="#">
                  <SettingsIcon sx={{ fontSize: 16, mr: 1 }} />
                  시스템 설정
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#">
                  <InfoIcon sx={{ fontSize: 16, mr: 1 }} />
                  도움말
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
            
            <Nav>
              <Box display="flex" alignItems="center" sx={{ mr: 3 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {currentTime.toLocaleString('ko-KR', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </Typography>
              </Box>
              
              <Badge 
                bg={stats.alarm > 0 ? 'danger' : 'success'} 
                className="me-3 p-2"
                style={{ fontSize: '0.8rem' }}
              >
                {stats.alarm > 0 ? `🚨 알람 ${stats.alarm}개` : '✅ 정상'}
              </Badge>
              
              <NavDropdown 
                title={
                  <span>
                    <AccountCircleIcon sx={{ fontSize: 20, mr: 1 }} />
                    관리자
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item href="#">
                  <AccountCircleIcon sx={{ fontSize: 16, mr: 1 }} />
                  프로필
                </NavDropdown.Item>
                <NavDropdown.Item href="#">
                  <SettingsIcon sx={{ fontSize: 16, mr: 1 }} />
                  계정 설정
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#" className="text-danger">
                  로그아웃
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        {/* 헤더 - 간소화 */}
        <GradientPaper elevation={0} sx={{ mb: 4, mt: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight="700" gutterBottom>
                📦 스마트 챙김 박스 관리
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                총 {stats.total}개 박스 | 보관중 {stats.stored}개 | 예약 {stats.reserved}개
                {stats.alarm > 0 && (
                  <Badge bg="danger" className="ms-2 animate__animated animate__pulse animate__infinite">
                    🚨 알람 {stats.alarm}개
                  </Badge>
                )}
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <ButtonGroup variant="contained" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Button 
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  <GridViewIcon />
                </Button>
                <Button 
                  onClick={() => setViewMode('table')}
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  <DashboardIcon />
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
        </GradientPaper>

        {/* 통계 카드 */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <Typography variant="h4" color="primary" fontWeight="700">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  전체 박스
                </Typography>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <Typography variant="h4" color="success.main" fontWeight="700">
                  {stats.stored}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  보관중
                </Typography>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <Typography variant="h4" color="warning.main" fontWeight="700">
                  {stats.reserved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  예약됨
                </Typography>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <Typography variant="h4" color="error.main" fontWeight="700">
                  {stats.alarm}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  알람 발생
                </Typography>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 필터 */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: '15px' }} elevation={2}>
          <Box display="flex" flexWrap="wrap" justifyContent="center" alignItems="center" gap={1}>
            <FilterChip
              label={`전체 (${boxes.length})`}
              onClick={() => setFilter('all')}
              color={filter === 'all' ? 'primary' : 'default'}
              variant={filter === 'all' ? 'filled' : 'outlined'}
              icon={<HomeIcon />}
            />
            <FilterChip
              label={`🚨 알람 (${stats.alarm})`}
              onClick={() => setFilter('alarm')}
              color={filter === 'alarm' ? 'error' : 'default'}
              variant={filter === 'alarm' ? 'filled' : 'outlined'}
              icon={<NotificationsActiveIcon />}
            />
            <FilterChip
              label={`📦 보관중 (${stats.stored})`}
              onClick={() => setFilter('stored')}
              color={filter === 'stored' ? 'success' : 'default'}
              variant={filter === 'stored' ? 'filled' : 'outlined'}
              icon={<InventoryIcon />}
            />
            <FilterChip
              label={`⏰ 예약됨 (${stats.reserved})`}
              onClick={() => setFilter('reserved')}
              color={filter === 'reserved' ? 'warning' : 'default'}
              variant={filter === 'reserved' ? 'filled' : 'outlined'}
              icon={<AccessTimeIcon />}
            />
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <IconButton 
              color="info" 
              onClick={() => setShowItemTypeModal(true)}
              sx={{ ml: 2 }}
            >
              <TuneIcon />
            </IconButton>
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* 메인 컨텐츠 */}
        {viewMode === 'grid' ? (
          // 그리드 뷰
          <Row>
            {filteredBoxes.map((box) => (
              <Col lg={4} md={6} key={box.boxNumber} className="mb-4">
                <Zoom in timeout={300 + box.boxNumber * 100}>
                  <div>
                    <StatusCard 
                      className="h-100 border-0 shadow text-white"
                      status={getBoxStatus(box)}
                      onClick={() => handleEditBox(box)}
                    >
                      <Card.Header className="border-0 bg-transparent">
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h5" fontWeight="700">
                            {box.boxNumber + 1}번 칸
                          </Typography>
                          {getStatusIcon(getBoxStatus(box))}
                        </Box>
                      </Card.Header>
                      <Card.Body>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* 왼쪽: 텍스트/버튼 영역 */}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                            {box.itemName || '물건 없음'}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                              상태: {getStatusText(getBoxStatus(box))}
                            </Typography>
                            {box.reservedTime && (
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                예약: {dayjs(box.reservedTime).format('MM-DD HH:mm')}
                              </Typography>
                            )}
                          </Box>
                          {/* 오른쪽: 이미지 영역 */}
                          <Box sx={{ width: '120px', height: '120px' }}>
                            {box.photoUrl ? (
                              <img
                                src={box.photoUrl}
                                alt="보관 물건"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '2px solid rgba(255,255,255,0.3)'
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '8px',
                                  border: '2px dashed rgba(255,255,255,0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#aaa',
                                  fontSize: '0.9rem'
                                }}
                              >
                                이미지 없음
                              </Box>
                            )}
                          </Box>       
                        </Box>                 
                        <Box mt={2}>
                          <Button 
                            variant="light" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBox(box);
                            }}
                            className="me-2"
                          >
                            <EditIcon sx={{ fontSize: 16 }} /> 수정
                          </Button>
                          {box.alarmOn && (
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearAlarm(box.boxNumber);
                              }}
                            >
                              <AlarmOffIcon sx={{ fontSize: 16 }} /> 해제
                            </Button>
                          )}
                        </Box>                         
                      </Card.Body>
                    </StatusCard>
                  </div>
                </Zoom>
              </Col>
            ))}
          </Row>
        ) : (
          // 테이블 뷰
          <Paper sx={{ borderRadius: '15px', overflow: 'hidden' }} elevation={3}>
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={filteredBoxes.map((b) => ({ ...b, id: b.boxNumber }))}
                columns={columns}
                pageSize={6}
                disableSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    borderColor: 'rgba(0,0,0,0.1)',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8f9fa',
                    fontWeight: '600',
                  },
                }}
              />
            </Box>
          </Paper>
        )}

        {/* 수정 모달 */}
        <Modal 
          show={!!editingBox} 
          onHide={() => setEditingBox(null)} 
          size="lg"
          centered
        >
          <Modal.Header closeButton className="border-0 bg-light">
            <Modal.Title className="d-flex align-items-center">
              <EditIcon className="me-2" />
              {editingBox && `${editingBox.boxNumber + 1}번 칸`} 설정
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <InventoryIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
                  물건 종류
                </Form.Label>
                <Form.Select 
                  value={tempItemData.itemName} 
                  onChange={(e) => setTempItemData({...tempItemData, itemName: e.target.value})}
                  className="form-select-lg"
                  style={{ borderRadius: '10px' }}
                >
                  <option value="">선택하세요</option>
                  {itemTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* 사진 촬영 섹션 */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <CameraAltIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
                  물건 사진
                </Form.Label>
                
                {tempItemData.photoUrl ? (
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <img 
                        src={tempItemData.photoUrl} 
                        alt="촬영된 물건" 
                        style={{ 
                          width: '100%', 
                          maxWidth: '300px', 
                          height: '200px', 
                          objectFit: 'cover', 
                          borderRadius: '10px' 
                        }} 
                      />
                      <div className="mt-3">
                        <Button 
                          variant="outline-primary" 
                          onClick={startCamera}
                          className="me-2"
                        >
                          <PhotoCameraIcon sx={{ mr: 1 }} />
                          다시 촬영
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          onClick={removePhoto}
                        >
                          <DeleteIcon sx={{ mr: 1 }} />
                          사진 삭제
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed text-center p-4" style={{ borderColor: '#dee2e6' }}>
                    <Card.Body>
                      <ImageIcon sx={{ fontSize: 60, color: '#6c757d', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        물건 사진을 촬영하여 보관 내역을 기록하세요
                      </Typography>
                      <Button 
                        variant="primary" 
                        onClick={startCamera}
                        size="lg"
                        className="mt-2"
                        style={{ borderRadius: '25px' }}
                      >
                        <PhotoCameraIcon sx={{ mr: 1 }} />
                        사진 촬영하기
                      </Button>
                    </Card.Body>
                  </Card>
                )}
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Check 
                  type="switch"
                  id="stored-switch"
                  label="보관 상태"
                  checked={tempItemData.stored}
                  onChange={(e) => setTempItemData({...tempItemData, stored: e.target.checked})}
                  className="fs-5"
                />
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <AccessTimeIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
                  사용 예약 시간
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={tempItemData.reservedTime}
                  onChange={(e) => setTempItemData({...tempItemData, reservedTime: e.target.value})}
                  className="form-control-lg"
                  style={{ borderRadius: '10px' }}
                />
                <Form.Text className="text-muted">
                  💡 예약 시간에 물건을 꺼내지 않으면 알람이 울립니다.
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light">
            <Button 
              variant="success" 
              onClick={updateBox}
              size="lg"
              className="px-4"
              style={{ borderRadius: '10px' }}
            >
              <CheckCircleIcon sx={{ mr: 1 }} />
              저장
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => setEditingBox(null)}
              size="lg"
              className="px-4"
              style={{ borderRadius: '10px' }}
            >
              취소
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 웹캠 촬영 모달 */}
        <Modal 
          show={showCamera} 
          onHide={stopCamera} 
          size="lg"
          centered
          backdrop="static"
        >
          <Modal.Header className="border-0 bg-dark text-white">
            <Modal.Title className="d-flex align-items-center">
              <CameraAltIcon sx={{ mr: 1 }} />
              물건 사진 촬영
              {stream && (
                <Badge bg="success" className="ms-2">
                  연결됨
                </Badge>
              )}
            </Modal.Title>
            <Button 
              variant="link" 
              className="text-white"
              onClick={stopCamera}
              style={{ textDecoration: 'none' }}
            >
              ✕
            </Button>
          </Modal.Header>
          
          <Modal.Body className="p-0 bg-black text-center position-relative" style={{ minHeight: '400px' }}>
            {/* 비디오 엘리먼트 */}
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              style={{ 
                width: '100%', 
                height: '400px',
                objectFit: 'cover',
                backgroundColor: '#000',
                display: stream ? 'block' : 'none'
              }}
            />
            
            {/* 로딩 표시 */}
            {!stream && (
              <div className="position-absolute top-50 start-50 translate-middle text-white">
                <Spinner animation="border" className="mb-3" />
                <div className="mb-2">카메라 준비 중...</div>
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={() => {
                    console.log('수동 재시작 시도');
                    restartCamera();
                  }}
                >
                  다시 시도
                </Button>
              </div>
            )}
            
            {/* 비디오 스트림은 있지만 검은 화면인 경우 */}
            {stream && videoRef.current && (
              <div className="position-absolute top-0 start-0 end-0 p-2">
                <small className="text-white-50">
                  해상도: {videoRef.current.videoWidth || '?'} x {videoRef.current.videoHeight || '?'}
                  {videoRef.current.videoWidth === 0 && (
                    <span className="text-warning ms-2">
                      ⚠️ 카메라 신호 없음
                    </span>
                  )}
                </small>
              </div>
            )}
            
            {/* 촬영 가이드 */}
            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-3">
              <div className="d-flex justify-content-between align-items-center">
                <small>📸 물건을 카메라 중앙에 위치시키고 촬영 버튼을 눌러주세요</small>
                {stream && videoRef.current && videoRef.current.videoWidth > 0 && (
                  <Badge bg="success">준비완료</Badge>
                )}
              </div>
            </div>
            
            {/* 숨겨진 캔버스 */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Modal.Body>
          
          <Modal.Footer className="border-0 bg-dark justify-content-center">
            {/* 촬영 버튼 */}
            <Button 
              variant="light" 
              size="lg"
              onClick={capturePhoto}
              className="px-5 me-3"
              style={{ borderRadius: '50px' }}
              disabled={!stream || (videoRef.current && videoRef.current.videoWidth === 0)}
            >
              <PhotoCameraIcon sx={{ fontSize: 30 }} />
            </Button>
            
            {/* 재시작 버튼 */}
            <Button 
              variant="warning" 
              onClick={() => {
                console.log('카메라 재시작 버튼 클릭');
                restartCamera();
              }}
              className="me-2"
              disabled={!stream}
            >
              🔄 재시작
            </Button>
            
            {/* 취소 버튼 */}
            <Button 
              variant="outline-light" 
              onClick={stopCamera}
            >
              취소
            </Button>
            
            {/* 디버그 정보 */}
            <div className="position-absolute bottom-2 start-2 text-white-50" style={{ fontSize: '10px' }}>
              {stream ? (
                <>
                  ✅ 스트림: {stream.getVideoTracks()[0]?.label || 'Unknown'}
                  {videoRef.current && (
                    <> | 📺 {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</>
                  )}
                </>
              ) : (
                '❌ 스트림 없음'
              )}
            </div>
          </Modal.Footer>
        </Modal>

        {/* 물건 종류 관리 모달 */}
        <Modal 
          show={showItemTypeModal} 
          onHide={() => setShowItemTypeModal(false)}
          centered
        >
          <Modal.Header closeButton className="border-0 bg-info text-white">
            <Modal.Title>
              <TuneIcon sx={{ mr: 1 }} />
              물건 종류 관리
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div className="mb-4">
              <Form.Label className="fw-bold">새 물건 종류 추가</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value)}
                  placeholder="예: 이어폰, 충전기..."
                  onKeyPress={(e) => e.key === 'Enter' && addItemType()}
                  style={{ borderRadius: '10px 0 0 10px' }}
                />
                <Button 
                  variant="primary" 
                  onClick={addItemType}
                  style={{ borderRadius: '0 10px 10px 0' }}
                >
                  <AddIcon />
                </Button>
              </div>
            </div>
            
            <div>
              <Form.Label className="fw-bold mb-3">현재 물건 종류</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {itemTypes.map(type => (
                  <Badge 
                    key={type} 
                    bg="light"
                    text="dark"
                    className="p-2 fs-6 position-relative"
                    style={{ borderRadius: '20px' }}
                  >
                    {type}
                    {!['지갑', '스마트폰', '열쇠', '약', '마스크'].includes(type) && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-danger p-0 ms-2"
                        onClick={() => removeItemType(type)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        ✕
                      </Button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowItemTypeModal(false)}
              className="px-4"
              style={{ borderRadius: '10px' }}
            >
              닫기
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 플로팅 액션 버튼 */}
        <Zoom in>
          <Fab 
            color="primary" 
            sx={{ 
              position: 'fixed', 
              bottom: 20, 
              right: 20,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              }
            }}
            onClick={() => setShowItemTypeModal(true)}
          >
            <TuneIcon />
          </Fab>
        </Zoom>

        {/* 알림 토스트 */}
        <ToastContainer position="bottom-start" className="p-3">
          <Toast 
            show={showToast} 
            onClose={() => setShowToast(false)} 
            delay={5000} 
            autohide
          >
            <Toast.Header className="bg-danger text-white">
              <NotificationsActiveIcon sx={{ mr: 1 }} />
              <strong className="me-auto">🚨 긴급 알림</strong>
            </Toast.Header>
            <Toast.Body className="bg-danger text-white fs-6">
              {alarmMessages[alarmMessages.length - 1]}
            </Toast.Body>
          </Toast>
        </ToastContainer>

        <audio ref={audioRef} preload="auto">
          <source src="/alarm.mp3" type="audio/mpeg" />
          <source src="/alarm.wav" type="audio/wav" />
        </audio>
      </Container>
    </Box>
  );
}

export default App;