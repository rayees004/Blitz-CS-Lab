from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.db.models import Count, Q
from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone

from .models import AcademyClass, AuditLog, Course, Lab, LabAssignment, LabAttempt, Student, StudyMaterial, User


def home(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'home.html')


def login_view(request):
    
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)
        print("=--------------------working---------------")
        if user:
            
            login(request, user)
            AuditLog.objects.create(
                actor=user,
                action='LOGIN',
                target='SESSION',
                result='SUCCESS',
                details=f'User {user.username} logged in successfully.'
            )
            return redirect('dashboard')
        messages.error(request, 'Invalid username or password.')
    return render(request, 'login.html')


@login_required
def logout_view(request):
    AuditLog.objects.create(
        actor=request.user,
        action='LOGOUT',
        target='SESSION',
        result='SUCCESS',
        details=f'User {request.user.username} logged out.'
    )
    logout(request)
    return redirect('home')


@login_required
def dashboard(request):
    user = request.user
    if user.role == 'STUDENT':
        student = Student.objects.filter(user=user).select_related('academy_class', 'academy_class__course').first()
        if not student:
            return HttpResponseForbidden('Student profile not found.')
        labs = Lab.objects.filter(id__in=LabAssignment.objects.filter(student=student).values_list('lab_id', flat=True))
        materials = StudyMaterial.objects.filter(
            Q(academy_class=student.academy_class) | Q(visibility='GLOBAL')
        ).select_related('course', 'academy_class').order_by('-publish_date')[:5]
        completed = LabAttempt.objects.filter(student=student, status='SUCCESS').values_list('lab_id', flat=True).distinct()
        total_labs = Lab.objects.filter(is_active=True).count()
        progress = round((completed.count() / total_labs) * 100, 2) if total_labs else 0
        return render(request, 'dashboard.html', {
            'student': student,
            'labs': labs,
            'materials': materials,
            'total_labs': total_labs,
            'completed_count': completed.count(),
            'remaining_labs': max(total_labs - completed.count(), 0),
            'progress': progress,
            'points': sum(l.points for l in Lab.objects.filter(id__in=completed)),
            'recent_activity': LabAttempt.objects.filter(student=student).order_by('-submitted_at')[:5],
        })
    if user.role in {'ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'}:
        return redirect('admin_dashboard')
    return HttpResponseForbidden('Access denied.')


@login_required
def admin_dashboard(request):
    if request.user.role not in {'ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'}:
        raise PermissionDenied('Students cannot access admin functionality.')
    class_count = AcademyClass.objects.count()
    student_count = Student.objects.count()
    active_students = Student.objects.filter(account_status='ACTIVE').count()
    fee_due = Student.objects.filter(fee_status='DUE').count()
    labs_count = Lab.objects.count()
    materials_count = StudyMaterial.objects.count()
    completed_labs = LabAttempt.objects.filter(status='SUCCESS').count()
    return render(request, 'admin_dashboard.html', {
        'class_count': class_count,
        'student_count': student_count,
        'active_students': active_students,
        'fee_due': fee_due,
        'labs_count': labs_count,
        'materials_count': materials_count,
        'completed_labs': completed_labs,
        'recent_activity': LabAttempt.objects.order_by('-submitted_at')[:10],
    })


@login_required
def study_material_detail(request, pk):
    material = StudyMaterial.objects.select_related('academy_class', 'course', 'related_lab').get(pk=pk)
    user = request.user
    if user.role == 'STUDENT':
        student = Student.objects.filter(user=user).first()
        if not student:
            return HttpResponseForbidden('Student profile missing.')
        if material.visibility == 'CLASS' and student.academy_class_id != material.academy_class_id:
            return HttpResponseForbidden('You are not authorized to view this material.')
        if material.visibility == 'STUDENT' and material.student_id != student.pk:
            return HttpResponseForbidden('You cannot access this material.')
    elif user.role not in {'ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'}:
        return HttpResponseForbidden('Unauthorized.')
    return render(request, 'study_material_detail.html', {'material': material})


@login_required
def lab_index(request):
    if request.user.role != 'STUDENT':
        return redirect('admin_dashboard')
    student = Student.objects.filter(user=request.user).first()
    if not student:
        return HttpResponseForbidden('Student profile missing.')
    assignments = LabAssignment.objects.filter(student=student).select_related('lab')
    labs = [assignment.lab for assignment in assignments]
    return render(request, 'lab_index.html', {'labs': labs})


@login_required
def lab_detail(request, pk):
    if request.user.role != 'STUDENT':
        return HttpResponseForbidden('Only students can access labs.')
    student = Student.objects.filter(user=request.user).select_related('academy_class').first()
    if not student:
        return HttpResponseForbidden('Student not found.')
    if student.fee_status == 'DUE' or student.lab_access != 'ENABLED':
        return HttpResponseForbidden('Your laboratory access is currently unavailable. Please contact Blitz Academy administration.')
    lab = Lab.objects.get(pk=pk)
    assignment = LabAssignment.objects.filter(student=student, lab=lab).first()
    if not assignment and not lab.is_active:
        return HttpResponseForbidden('This lab is not currently available.')
    return render(request, 'lab_detail.html', {'lab': lab, 'student': student, 'assigned': bool(assignment)})


@login_required
def lab_submit(request, pk):
    if request.user.role != 'STUDENT':
        return HttpResponseForbidden('Only students can submit flags.')
    student = Student.objects.filter(user=request.user).first()
    if not student:
        return HttpResponseForbidden('Student profile missing.')
    lab = Lab.objects.get(pk=pk)
    if student.fee_status == 'DUE' or student.lab_access != 'ENABLED':
        return HttpResponseForbidden('Your laboratory access is currently unavailable.')
    assignment = LabAssignment.objects.filter(student=student, lab=lab).first()
    if not assignment and not lab.is_active:
        return HttpResponseForbidden('This lab is not available for your account.')
    submitted = request.POST.get('flag', '')
    status = 'SUCCESS' if submitted == lab.flag else 'FAIL'
    LabAttempt.objects.create(student=student, lab=lab, submitted_flag=submitted, status=status)
    if status == 'SUCCESS':
        StudentProgress.objects.update_or_create(
            student=student,
            lab=lab,
            defaults={'completed': True, 'points_earned': lab.points, 'attempts': 1, 'last_updated': timezone.now()}
        )
        messages.success(request, 'Flag accepted. Lab completed!')
        return redirect('lab_detail', pk=lab.pk)
    messages.error(request, 'Incorrect flag. Try again.')
    return redirect('lab_detail', pk=lab.pk)


@login_required
def lab_reset(request, pk):
    if request.user.role != 'STUDENT':
        return HttpResponseForbidden('Only students can reset labs.')
    lab = Lab.objects.get(pk=pk)
    messages.info(request, f'{lab.name} has been reset to its default training state.')
    return redirect('lab_detail', pk=lab.pk)


# Security helpers for future API usage.
def user_has_permission(user, permission_name):
    return permission_name in getattr(user, 'permissions', [])


def safe_json_status(status, message):
    return JsonResponse({'status': status, 'message': message})
